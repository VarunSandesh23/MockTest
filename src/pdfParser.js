import { getGenerativeModel } from "firebase/ai";
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
      const jsonModel = getGenerativeModel(ai, {
          model: "gemini-3.5-flash",
          generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
          }
      });

      const pdfPart = await fileToGenerativePart(file);
      const prompt = "You are an expert exam parser. Your job is to extract EVERY SINGLE multiple choice question from this exam paper IN THE EXACT ORDER they appear. Extract ALL of them from the first page to the last page. DO NOT skip any questions. DO NOT summarize. DO NOT use '...' or truncate the output under any circumstances. You must return the full exhaustive list. Return a STRICTLY VALID JSON array where each object has exactly: 'questionNumber' (integer, the original number in the exam), 'subject' (string), 'text' (string), 'options' (array of exactly 4 strings), 'correctAnswer' (integer 0-3 based on the correct option, or 0 if answer is not provided), and 'hasImageOrDiagram' (boolean, set to true ONLY if the question references a figure, graph, or diagram that cannot be extracted as text). ALL property names MUST be enclosed in double quotes. DO NOT wrap the output in markdown.";

      const result = await jsonModel.generateContent([prompt, pdfPart]);
      let jsonText = result.response.text();
      
      // Sometimes AI still wraps JSON in markdown blocks despite instructions
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      // If the AI got lazy and tried to summarize with "..." or ..., clean it up so JSON.parse doesn't crash
      jsonText = jsonText.replace(/,\s*(?:"\.\.\."|\.\.\.)\s*\]/g, ']');
      jsonText = jsonText.replace(/\[\s*(?:"\.\.\."|\.\.\.)\s*,\s*/g, '[');
      jsonText = jsonText.replace(/(?:"\.\.\."|\.\.\.)/g, '');

      // Also ensure we only try to parse the array part
      const firstBracket = jsonText.indexOf('[');
      const lastBracket = jsonText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
      }

      const rawQuestions = JSON.parse(jsonText);

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
        
        questions[subj].push({
          id: `dyn_${subj.substring(0,3).toLowerCase()}_${q.questionNumber || index + 1}`,
          questionNumber: q.questionNumber || index + 1,
          hasImageOrDiagram: !!q.hasImageOrDiagram,
          subject: subj,
          text: q.text || "Unknown Question",
          options: (Array.isArray(q.options) && q.options.length >= 4) ? q.options.slice(0,4) : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0
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
