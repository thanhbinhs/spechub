import {
  SPECHUB_CONVERSATION_SYSTEM_PROMPT,
  SPECHUB_RAG_SYSTEM_PROMPT,
} from "./spechub-ai.instructions";

describe("SpecHub AI instructions", () => {
  it("keeps the SpecHub identity and voice consistent in every mode", () => {
    for (const instructions of [
      SPECHUB_CONVERSATION_SYSTEM_PROMPT,
      SPECHUB_RAG_SYSTEM_PROMPT,
    ]) {
      expect(instructions).toContain("You are SpecHub AI");
      expect(instructions).toContain("calm, clear, practical");
      expect(instructions).toContain("call yourself “mình”");
      expect(instructions).toContain("QUY TẮC GIỌNG ĐIỆU TIẾNG VIỆT BẮT BUỘC");
      expect(instructions).toContain("Naturally connect the answer to SpecHub");
      expect(instructions).not.toContain("As a language model");
    }
  });

  it("lets conversation answer simple questions without inventing product data", () => {
    expect(SPECHUB_CONVERSATION_SYSTEM_PROMPT).toContain(
      "ordinary general-knowledge questions",
    );
    expect(SPECHUB_CONVERSATION_SYSTEM_PROMPT).toContain(
      "begin by confirming that you can",
    );
    expect(SPECHUB_CONVERSATION_SYSTEM_PROMPT).toContain(
      "bắt buộc nhắc tên SpecHub",
    );
    expect(SPECHUB_CONVERSATION_SYSTEM_PROMPT).toContain(
      "Never answer those product claims from memory",
    );
  });

  it("requires database answers to remain grounded and cited", () => {
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain(
      "Use only the approved SpecHub context",
    );
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain("not a catalog field reader");
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain(
      "Cite every concrete database claim",
    );
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain(
      "Never introduce, recommend, or compare a device",
    );
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain(
      "cover every material populated category",
    );
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain("Do not invent star ratings");
    expect(SPECHUB_RAG_SYSTEM_PROMPT).toContain(
      "does not prove the device lacks the feature",
    );
  });
});
