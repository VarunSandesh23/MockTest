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
    { id: 'N24H01A0090', password: 'student123', name: 'Yashwanth' }
  ],
  subjects: ["Physics", "Chemistry", "Mathematics"],
  questions: {
    Physics: Array.from({ length: 30 }, (_, i) => ({
      id: `phy_${i + 1}`,
      subject: "Physics",
      text: i === 0 ? "What is the SI unit of Force?" : 
            i === 1 ? "Which of the following is a scalar quantity?" : 
            i === 2 ? "The value of acceleration due to gravity (g) at the center of the earth is:" :
            `Physics Question ${i + 1}`,
      options: i === 0 ? ["Joule", "Newton", "Watt", "Pascal"] :
               i === 1 ? ["Velocity", "Force", "Displacement", "Speed"] :
               i === 2 ? ["9.8 m/s²", "Infinity", "Zero", "1/9.8 m/s²"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 2 : 0, // index of option
    })),
    Chemistry: Array.from({ length: 30 }, (_, i) => ({
      id: `chem_${i + 1}`,
      subject: "Chemistry",
      text: i === 0 ? "What is the atomic number of Carbon?" : 
            i === 1 ? "Which gas is evolved when zinc reacts with dilute HCl?" :
            i === 2 ? "What is the pH of a neutral solution at 25°C?" :
            `Chemistry Question ${i + 1}`,
      options: i === 0 ? ["5", "6", "7", "8"] :
               i === 1 ? ["Oxygen", "Chlorine", "Hydrogen", "Nitrogen"] :
               i === 2 ? ["0", "7", "14", "1"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 1 : 0,
    })),
    Mathematics: Array.from({ length: 30 }, (_, i) => ({
      id: `math_${i + 1}`,
      subject: "Mathematics",
      text: i === 0 ? "What is the derivative of sin(x) with respect to x?" : 
            i === 1 ? "If a matrix has 3 rows and 4 columns, what is its order?" :
            i === 2 ? "What is the value of log(1) to any non-zero base?" :
            `Mathematics Question ${i + 1}`,
      options: i === 0 ? ["cos(x)", "-sin(x)", "-cos(x)", "tan(x)"] :
               i === 1 ? ["4x3", "3x4", "7", "12"] :
               i === 2 ? ["1", "10", "0", "Undefined"] :
               ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : 0,
    })),
  }
};
