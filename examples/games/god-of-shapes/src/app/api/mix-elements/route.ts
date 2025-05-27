import { NextResponse } from "next/server";
import { OpenAI } from "openai";


const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY || "",
  baseURL: "https://api.shapes.inc/v1",
});

export async function POST(request: Request) {
  try {
    
    const { element1, element2 } = await request.json();

    
    if (!element1 || !element2) {
      return NextResponse.json(
        { error: "Both elements are required" },
        { status: 400 }
      );
    }

    
    const response = await shapesClient.chat.completions.create({
     
      model:"shapesinc/elementcreatorv2",
      messages: [
        {
          role: "system",
          content:
            'You are a fusion generator inspired by Infinite Craft. Given two basic objects or elements, generate:\n\n1. A \'mix\' — a simple and intuitive fusion of the two inputs. This can be a real word, a blended word, or a fun concept.\n2. A single emoji that represents the fusion.\n\nThe fusion must:\n- Be simple, ideally one word or two-word compound.\n- Avoid articles (no \'the\', \'a\', etc.).\n- Feel natural, elemental, or imaginative.\n- Favor direct associations.\n\nAlways respond strictly in the following JSON format:\n{\n  "input_1": "<first input>",\n  "input_2": "<second input>",\n  "mix": "<simple, intuitive or fun fusion, AT MOST TWO WORDS>",\n  "emoji": "<a SINGLE emoji>"\n}',
        },
        {
          role: "user",
          content: `${element1} and ${element2}`,
        },
      ],
    });

    const mixContent = response.choices[0].message.content;

    if (!mixContent) {
      return NextResponse.json(
        { error: "Failed to generate mix" },
        { status: 500 }
      );
    }

    try {
      
      const mixData = JSON.parse(mixContent);

      
      return NextResponse.json({
        result: mixData.emoji,
        description: `${element1} + ${element2} = ${mixData.mix}`,
      });
    } catch (error) {
      console.error("Error parsing API response:", error);
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process element combination" },
      { status: 500 }
    );
  }
}
