export const mockData = {
  admins: [{ username: 'admin', password: 'admin123' }],
  students: [
    { id: 'N24H01A0317', password: 'student123', name: 'Vinay' },
    { id: 'N24H01A0592', password: 'student123', name: 'Chakri' },
    { id: 'N24H01A0245', password: 'student123', name: 'Varun' },
    { id: 'N24H01A0532', password: 'student123', name: 'Jashwanth' },
    { id: 'N24H01A0644', password: 'student123', name: 'Sathwik' },
    { id: 'N24H01A0650', password: 'student123', name: 'Harsha' },
    { id: 'N24H01A0646', password: 'student123', name: 'Hemanth' },
    { id: 'N24H01A0090', password: 'student123', name: 'Yashwanth' },
    { id: 'N24H01A0079', password: 'student123', name: 'A1' },
    { id: 'N24H01A0606', password: 'student123', name: 'A2' },
    { id: 'N24H01A0395', password: 'student123', name: 'A3' },
    { id: 'N24H01A0542', password: 'student123', name: 'A4' },
    { id: 'N24H01A0104', password: 'student123', name: 'A5' },
    { id: 'N24H01A0088', password: 'student123', name: 'A6' },
    { id: 'N24H01A0330', password: 'student123', name: 'A7' },
    { id: 'N24H01A0469', password: 'student123', name: 'A8' },
    { id: 'N24H01A0227', password: 'student123', name: 'A9' },
    { id: 'N24H01A0024', password: 'student123', name: 'A10' },
    { id: 'N24H01A0581', password: 'student123', name: 'A11' },
    { id: 'N24H01A0579', password: 'student123', name: 'A12' },
    { id: 'N24H01A0450', password: 'student123', name: 'A13' },
    { id: 'N24H01A0557', password: 'student123', name: 'A14' },
    { id: 'N24H01A0226', password: 'student123', name: 'A15' },
    { id: 'N24H01A0170', password: 'student123', name: 'A16' },
    { id: 'N24H01A0633', password: 'student123', name: 'A17' },
    { id: 'N24H01A0433', password: 'student123', name: 'A18' },
    { id: 'N24H01A0150', password: 'student123', name: 'A19' },
    { id: 'N24H01A0197', password: 'student123', name: 'A20' },
    { id: 'N24H01A0209', password: 'student123', name: 'A21' },
    { id: 'N24H01A0480', password: 'student123', name: 'A22' },
    { id: 'N24H01A0635', password: 'student123', name: 'A23' },
    { id: 'N24H01A0059', password: 'student123', name: 'A24' },
    { id: 'N24H01A0174', password: 'student123', name: 'A25' },
    { id: 'N24H01A0253', password: 'student123', name: 'A26' },
    { id: 'N24H01A0406', password: 'student123', name: 'A27' },
    { id: 'N24H01A0322', password: 'student123', name: 'A28' },
    { id: 'N24H01A0258', password: 'student123', name: 'A29' },
    { id: 'N24H01A0239', password: 'student123', name: 'A30' },
    { id: 'N24H01A0324', password: 'student123', name: 'A31' },
    { id: 'N24H01A0062', password: 'student123', name: 'A32' },
    { id: 'N24H01A0157', password: 'student123', name: 'A33' },
    { id: 'N24H01A0198', password: 'student123', name: 'A34' },
    { id: 'N24H01A0629', password: 'student123', name: 'A35' },
    { id: 'N24H01A0388', password: 'student123', name: 'A36' },
    { id: 'N24H01A0037', password: 'student123', name: 'A37' },
    { id: 'N24H01A0496', password: 'student123', name: 'A38' }
  ],
  subjects: ["Physics", "Chemistry", "Mathematics"],
  questions: {
    Physics: Array.from({ length: 30 }, (_, i) => ({
      id: `phy_${i + 1}`,
      subject: "Physics",
      type: i >= 25 ? "NUMERICAL" : "MCQ",
      text: i === 0 ? "What is the SI unit of Force?" : 
            i === 1 ? "Which of the following is a scalar quantity?" : 
            i === 2 ? "The value of acceleration due to gravity (g) at the center of the earth is:" :
            i === 25 ? "A body of mass 5 kg is moving with a velocity of 10 m/s. Calculate its kinetic energy in Joules." :
            i === 26 ? "If a current of 2 A flows through a resistor of 5 Ω for 10 seconds, find the heat dissipated in Joules." :
            i >= 25 ? `Physics Numerical Question ${i + 1} (Enter integer value)` :
            `Physics Question ${i + 1}`,
      options: i >= 25 ? [] :
               i === 0 ? ["Joule", "Newton", "Watt", "Pascal"] :
               i === 1 ? ["Velocity", "Force", "Displacement", "Speed"] :
               i === 2 ? ["9.8 m/s²", "Infinity", "Zero", "1/9.8 m/s²"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 25 ? 250 : i === 26 ? 200 : i >= 27 ? (i * 2) : (i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 2 : 0),
    })),
    Chemistry: Array.from({ length: 30 }, (_, i) => ({
      id: `chem_${i + 1}`,
      subject: "Chemistry",
      type: i >= 25 ? "NUMERICAL" : "MCQ",
      text: i === 0 ? "What is the atomic number of Carbon?" : 
            i === 1 ? "Which gas is evolved when zinc reacts with dilute HCl?" :
            i === 2 ? "What is the pH of a neutral solution at 25°C?" :
            i === 25 ? "What is the oxidation state of Sulfur in H2SO4?" :
            i === 26 ? "How many moles of water are present in 36 grams of pure water?" :
            i >= 25 ? `Chemistry Numerical Question ${i + 1} (Enter integer value)` :
            `Chemistry Question ${i + 1}`,
      options: i >= 25 ? [] :
               i === 0 ? ["5", "6", "7", "8"] :
               i === 1 ? ["Oxygen", "Chlorine", "Hydrogen", "Nitrogen"] :
               i === 2 ? ["0", "7", "14", "1"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 25 ? 6 : i === 26 ? 2 : i >= 27 ? (i + 5) : (i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 1 : 0),
    })),
    Mathematics: Array.from({ length: 30 }, (_, i) => ({
      id: `math_${i + 1}`,
      subject: "Mathematics",
      type: i >= 25 ? "NUMERICAL" : "MCQ",
      text: i === 0 ? "What is the derivative of sin(x) with respect to x?" : 
            i === 1 ? "If a matrix has 3 rows and 4 columns, what is its order?" :
            i === 2 ? "What is the value of log(1) to any non-zero base?" :
            i === 25 ? "If f(x) = x³ - 3x² + 2, what is the value of f(3)?" :
            i === 26 ? "What is the degree of the polynomial P(x) = 4x⁵ - 3x² + 7?" :
            i >= 25 ? `Mathematics Numerical Question ${i + 1} (Enter integer value)` :
            `Mathematics Question ${i + 1}`,
      options: i >= 25 ? [] :
               i === 0 ? ["cos(x)", "-sin(x)", "-cos(x)", "tan(x)"] :
               i === 1 ? ["4x3", "3x4", "7", "12"] :
               i === 2 ? ["1", "10", "0", "Undefined"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 25 ? 2 : i === 26 ? 5 : i >= 27 ? (i - 10) : (i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 0),
    })),
  }
};
