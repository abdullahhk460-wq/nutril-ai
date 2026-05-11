import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMealPlan(userData: any) {
  const prompt = `
    As a professional Nutritionist and Fitness Coach, generate a 1-day meal plan for the following user:
    - Goal: ${userData.healthGoal}
    - Budget: ${userData.dailyBudget} ${userData.currency || 'PKR'}
    - Location: ${userData.country}, ${userData.province || ''}
    - Preferences: ${userData.preferences || 'None'}
    
    Ensure the meals are:
    1. Culturally relevant to ${userData.country}.
    2. Within the budget of ${userData.dailyBudget}.
    3. Aligned with ${userData.healthGoal}.
    4. VARIANT (do not suggest same thing every time).
    
    Return the plan in JSON format with:
    {
      "breakfast": { "name": string, "calories": number, "price": number, "why": string },
      "lunch": { "name": string, "calories": number, "price": number, "why": string },
      "dinner": { "name": string, "calories": number, "price": number, "why": string },
      "snack": { "name": string, "calories": number, "price": number, "why": string },
      "totalCalories": number,
      "totalCost": number
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function getCoachAdvice(query: string, history: any[], userProfile?: any, mealItems?: any[]) {
  const mealContext = mealItems && mealItems.length > 0 
    ? `\nUser's Available Meal Inventory:\n${mealItems.map(m => `- ${m.name} (${m.category}): ${m.price} PKR`).join('\n')}`
    : '\nUser has no items in their inventory yet.';

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are NutriLife AI Coach, a friendly expert in nutrition, fitness, and minimalist budgeting. 
      Help users with their health goals and meal planning in a supportive way. Be concise.
      Current User Context:
      - Name: ${userProfile?.fullName || 'User'}
      - Health Goal: ${userProfile?.healthGoal || 'General Wellness'}
      - Location: ${userProfile?.country || 'Not set'}, ${userProfile?.province || ''}
      - Daily Food Budget: ${userProfile?.dailyBudget || 'Not set'} PKR
      ${mealContext}
      Always tailor your advice to their specific budget, goal, and the actual food items they have listed above. If they have no items, suggest affordable local options.`
    }
  });

  const response = await chat.sendMessage({
    message: query
  });

  return response.text;
}
