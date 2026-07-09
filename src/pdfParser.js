import { getGenerativeModel, SchemaType } from "firebase/ai";
import { ai } from "./firebase";

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export const parsePdfQuestions = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const schema = {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            type: { type: SchemaType.STRING },
            questionNumber: { type: SchemaType.INTEGER },
            subject: { type: SchemaType.STRING },
            text: { type: SchemaType.STRING },
            options: { 
              type: SchemaType.ARRAY, 
              items: { type: SchemaType.STRING } 
            },
            correctAnswer: { type: SchemaType.NUMBER },
            hasImageOrDiagram: { type: SchemaType.BOOLEAN }
          },
          required: ["type", "questionNumber", "subject", "text", "options", "correctAnswer", "hasImageOrDiagram"]
        }
      };

      const pdfPart = await fileToGenerativePart(file);
      const prompt = "You are an expert exam parser. Your job is to extract EVERY SINGLE question (both Multiple Choice Questions and Numerical Answer Type / Integer value questions) from this exam paper IN THE EXACT ORDER they appear. Extract ALL of them from the first page to the last page. DO NOT skip any questions. DO NOT summarize. DO NOT use '...' or truncate the output under any circumstances. You must return the full exhaustive list. Return a STRICTLY VALID JSON array where each object has exactly: 'type' (string, either 'MCQ' or 'NUMERICAL'), 'questionNumber' (integer, the original number in the exam), 'subject' (string), 'text' (string), 'options' (array of exactly 4 strings for MCQ, or empty array [] for NUMERICAL), 'correctAnswer' (number: integer 0-3 based on option index for MCQ, or the exact numerical answer value for NUMERICAL), and 'hasImageOrDiagram' (boolean, set to true ONLY if the question references a figure, graph, or diagram that cannot be extracted as text). ALL property names MUST be enclosed in double quotes. DO NOT wrap the output in markdown.";

      const tryGenerateWithModels = async (models, promptStr, part) => {
        let lastError;
        for (const modelName of models) {
          try {
            console.log(`Attempting PDF extraction with model: ${modelName}...`);
            const jsonModel = getGenerativeModel(ai, {
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    maxOutputTokens: 65536,
                }
            });
            const res = await jsonModel.generateContent([promptStr, part]);
            return res;
          } catch (err) {
            console.warn(`Model ${modelName} failed:`, err);
            lastError = err;
          }
        }
        throw lastError;
      };

      const result = await tryGenerateWithModels(["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.1-flash-lite"], prompt, pdfPart);
      const jsonText = result.response.text();
      
      let rawQuestions;
      try {
        rawQuestions = JSON.parse(jsonText);
      } catch (parseErr) {
        console.warn("Direct JSON.parse failed, attempting to repair truncated JSON...", parseErr);
        let trimmed = jsonText.trim();
        if (trimmed.startsWith('[')) {
          const lastValidObjectEnd = trimmed.lastIndexOf('}');
          if (lastValidObjectEnd !== -1) {
            const repairedString = trimmed.substring(0, lastValidObjectEnd + 1) + ']';
            try {
              rawQuestions = JSON.parse(repairedString);
              console.log(`Successfully repaired JSON! Extracted ${rawQuestions.length} complete questions from truncated output.`);
            } catch (repairErr) {
              throw parseErr;
            }
          } else {
            throw parseErr;
          }
        } else {
          throw parseErr;
        }
      }

      const subjects = [];
      const questions = {};
      let hasImages = false;

      if (!Array.isArray(rawQuestions)) {
        throw new Error("AI did not return a valid array of questions.");
      }

      // Sort by the original question number to preserve order
      rawQuestions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      rawQuestions.forEach((q, index) => {
        if (q.hasImageOrDiagram) {
          hasImages = true;
        }

        const subj = q.subject || "General";
        if (!subjects.includes(subj)) {
          subjects.push(subj);
          questions[subj] = [];
        }
        
        const qType = q.type === 'NUMERICAL' ? 'NUMERICAL' : 'MCQ';
        questions[subj].push({
          id: `dyn_${subj.substring(0,3).toLowerCase()}_${q.questionNumber || index + 1}`,
          type: qType,
          questionNumber: q.questionNumber || index + 1,
          hasImageOrDiagram: !!q.hasImageOrDiagram,
          subject: subj,
          text: q.text || "Unknown Question",
          options: qType === 'NUMERICAL' ? [] : ((Array.isArray(q.options) && q.options.length >= 4) ? q.options.slice(0,4) : ["Option A", "Option B", "Option C", "Option D"]),
          correctAnswer: qType === 'NUMERICAL' ? (typeof q.correctAnswer === 'number' ? q.correctAnswer : Number(q.correctAnswer) || 0) : (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0)
        });
      });

      const totalQuestions = Object.values(questions).reduce((acc, arr) => acc + arr.length, 0);

      if (totalQuestions === 0) {
        throw new Error("No questions could be extracted by the AI.");
      }

      resolve({ subjects, questions, totalQuestions, hasImages });
    } catch (err) {
      console.error(err);
      reject(new Error("Failed to process PDF with AI: " + err.message));
    }
  });
};
