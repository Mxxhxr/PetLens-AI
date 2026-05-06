import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { image } = await req.json();

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: `You are an expert in cat behavior and body language. Analyze this image and describe:
1. The cat's current mood and emotional state
2. Key body language signals you can see (ears, tail, posture, eyes etc.)
3. What the cat likely wants or is feeling

If there is no cat in the image, just say "No cat detected".
Be concise - 1 to 3 sentences max.`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  console.log("Gemini response:", JSON.stringify(data, null, 2));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI";

  return NextResponse.json({ result: text });
}