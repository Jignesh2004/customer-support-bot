require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a customer support assistant for TechStore India.

STRICT RULES - FOLLOW EXACTLY:
1. ONLY use information written below. NEVER use your own knowledge.
2. If answer is not below, say EXACTLY: "I don't have that information. Please call us."
3. Keep replies under 3 lines maximum.

COMPANY INFO:
- Products: laptops, phones, and accessories
- Return policy: 7 days only, original packaging required
- Working hours: Monday to Saturday, 9 AM to 6 PM IST

ANYTHING NOT IN COMPANY INFO ABOVE = say you don't know.`;

const escalationWords = ['angry', 'furious', 'lawsuit', 'legal', 'fraud', 'cheated'];

app.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  const needsHuman = escalationWords.some(word => message.toLowerCase().includes(word));
  if (needsHuman) {
    return res.json({ reply: 'I understand your concern. Let me connect you with our senior support team immediately. Please hold.' });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history || []),
        { role: 'user', content: message }
      ]
    });
    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});