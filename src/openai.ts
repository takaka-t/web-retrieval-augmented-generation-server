import OpenAI, { toFile } from "openai";
import { promises, createReadStream } from "fs";
import path from "path";

// 各ファイルでのimportが煩わしいためglobalThisを利用

// TODO
// アシスタントの作成はOpneAI管理画面で行えばよいのか
// それでアシスタントIDをenvに設定するとか
// ファイル差し替え用のAPIを作成するだけで十分かも

declare global {
  /**
   * OpenAI Instance
   */
  var openai: OpenAI;
  /**
   * OpenAI VectorStore ID
   */
  var openaiVectorStoreId: string;
  /**
   * OpenAI Assistant ID
   */
  var openaiAssistantId: string;
  /**
   * VectorStore にファイルをアップロードして Assistant を作成する
   */
  var uploadFilesAndCreateAssistant: () => Promise<void>;
  /**
   * OpenAI Assistant ID を設定する
   */
  var setOpenaiAssistantId: (argument: { openaiAssistantId: string }) => Promise<void>;
  /**
   * Thread を作成して実行する
   * @returns 回答メッセージ
   */
  var createThreadAndRun: (argument: { messages: OpenAI.Beta.Threads.ThreadCreateParams.Message[] }) => Promise<string>;
}

/**
 * OpneAI を初期化する
 */
export const initializeOpenAI = async (): Promise<void> => {
  // Initialize OpenAI
  global.openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize Function
  global.uploadFilesAndCreateAssistant = async (): Promise<void> => {
    console.log("vectorStoreId", global.openaiVectorStoreId);

    /** VectorStore Instance */
    const vectorStore = await global.openai.beta.vectorStores.create({
      name: "テスト用",
      expires_after: { anchor: "last_active_at", days: 1 },
    });
    console.log("vectorStoreId", vectorStore.id);
    // Keep VectorStore ID
    global.openaiVectorStoreId = vectorStore.id;

    // Upload files to VectorStore
    const filesDirectory = "./files";
    const fileNames = (await promises.readdir(filesDirectory)).filter((name) => name.endsWith(".txt"));
    const files = await Promise.all(fileNames.map((fileName) => toFile(createReadStream(path.join(filesDirectory, fileName)))));
    await global.openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files });

    /** Assistant Instance */
    const assistant = await global.openai.beta.assistants.create({
      name: "とある人の紹介",
      model: "gpt-4-turbo",
      instructions: "あなたはアップロードされたファイルを元に質問に答えることができます。そのファイルで説明されている人のつもりで回答してください。",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id],
        },
      },
    });
    console.log("assistantId", assistant.id);
    // Keep Assistant ID
    global.openaiAssistantId = assistant.id;
  };

  // Initialize Function
  global.setOpenaiAssistantId = async (argument: { openaiAssistantId: string }): Promise<void> => {
    global.openaiAssistantId = argument.openaiAssistantId;
  };

  // Initialize Function
  global.createThreadAndRun = async (argument: { messages: OpenAI.Beta.Threads.ThreadCreateParams.Message[] }): Promise<string> => {
    // Check Assistant ID
    if (global.openaiAssistantId === undefined) {
      throw new Error("Assistant not created");
    }

    /** Thread Instance */
    const thread = await global.openai.beta.threads.create({
      messages: argument.messages,
    });

    // Run Thread and polling
    await global.openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: global.openaiAssistantId,
    });

    // Return reply message
    const messages = await global.openai.beta.threads.messages.list(thread.id);
    const reply = messages.data[0]?.content[0];
    if (reply.type === "text") {
      console.log("message: ", reply.text.value);
      console.log("annotations: ", reply.text.annotations);
      return reply.text.value;
    } else {
      console.log("テキスト以外が返却されている");
      throw new Error("テキスト以外が返却されている");
    }
  };
};
