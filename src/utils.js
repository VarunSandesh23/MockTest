// Helper to generate a 6-digit rolling PIN based on examId and current minute
export const getExamPin = (examId, minuteOffset = 0) => {
  const minuteHash = Math.floor(Date.now() / 60000) + minuteOffset;
  
  // Create a numeric seed from examId
  let idSeed = 0;
  for (let i = 0; i < String(examId).length; i++) {
    idSeed = (idSeed * 31 + String(examId).charCodeAt(i)) >>> 0;
  }
  
  // Combine idSeed and minuteHash
  let combined = (idSeed + minuteHash) >>> 0;
  
  // Mulberry32-like mixing to scatter the bits wildly
  let t = combined + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  t = (t ^ (t >>> 14)) >>> 0;
  
  let pin = (t % 1000000).toString();
  while (pin.length < 6) {
    pin = '0' + pin;
  }
  return pin;
};

// Helper to generate a unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
