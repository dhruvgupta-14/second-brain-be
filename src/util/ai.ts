import OpenAI from "openai";
import { configDotenv } from "dotenv";
import { Request, Response } from "express";
import { pc } from "./pinecone.js";
import { System_Summarize_Prompt, SYSTEM_TITLE_PROMPT } from "../prompts.js";
import { query } from "express-validator";
configDotenv();
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY, // Azure API key
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/`,
  defaultQuery: {
    "api-version": process.env.AZURE_OPENAI_API_VERSION || "2024-03-01-preview",
  },
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_KEY,
  },
});

export async function suggestTitle(req: any, res: Response): Promise<void> {
  try {
    const query: string = req.body.query;
    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        { role: "system", content: SYSTEM_TITLE_PROMPT.trim() },
        { role: "user", content: query.trim() },
      ],
      temperature: 0.5,
      max_tokens: 40,
    });

    const title = response.choices[0].message.content?.trim() || "Untitled";
    res.status(200).json({
      title: title,
    });
    return;
  } catch (error) {
    console.error("suggestTitle error:", error);
    res.status(200).json({
      message: "Internal Server Error",
    });
    return;
  }
}
export async function askAI(req: any, res: Response): Promise<void> {
  const user = req.user;
  const query = req.body.question;
  try {
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    const results: any = await index.searchRecords({
      query: {
        topK: 8,
        inputs: { text: query },
      },
      rerank: {
        model: "bge-reranker-v2-m3",
        topN: 10,
        rankFields: ["text"],
      },
    });
    const context = results.result.hits
      .map((item: any, i: any) => {
        const fields = item.fields;
        return `(${i + 1})
       Title: ${fields.title}
       Tags: ${Array.isArray(fields.tags) ? fields.tags.join(", ") : ""}
       Type: ${fields.contentType}
       Category: ${fields.category}
       Date: ${fields.date}
       ${fields.link ? `Link: ${fields.link}` : ""}
       Text: ${fields.text || ""}|`;
      })
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        { role: "system", content: System_Summarize_Prompt+ context },
        { role: "user", content: query }, 
      ],
      temperature: 0.4,
    });

    const answer = completion.choices[0].message.content;
    res.status(200).json({
      success: true,
      message: "AI Answer Generated",
      aiAnswer: answer,
      pineconeMatches: results.result.hits,
    });
  } catch (err) {
    console.error("askAI error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process AI query",
    });
  }
}
