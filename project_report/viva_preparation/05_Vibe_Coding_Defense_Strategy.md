# The "Vibe-Coding" Defense Strategy

Modern software engineering often relies on AI, boilerplate generations, and sophisticated libraries (Vite, Tailwind, Multer, etc.). You might not know exactly what line 14 of `vite.config.js` does by memory—and that is completely fine.

If an examiner points to a block of code during the viva and you don't know the exact syntax, **DO NOT PANIC**. Use the strategy: **Acknowledge the tool, pivot to the architecture.**

## Scenario 1: Configuration Files
*Examiner points to `tailwind.config.js` or `postcss.config.cjs`.*
*   **Don't say:** "I don't know, the AI wrote it."
*   **Do say:** "Those are configuration constraints for TailwindCSS. Rather than writing raw CSS, the build step uses PostCSS to parse these configs, purging unused CSS to keep the final frontend bundle incredibly lightweight."

## Scenario 2: Boilerplate Hooks / Libraries
*Examiner points to the `useAuth` hook or `multer` setup and asks what a specific parameter like `memoryStorage()` means.*
*   **Don't say:** "I just copied it from the documentation."
*   **Do say:** "That parameter tells the Multer middleware to store the incoming image in the server's ephemeral RAM (a Buffer) rather than writing to disk. I chose this because writing a heavy image stream to disk and then reading it back to send to the GPU would bottleneck my I/O operations."

## Scenario 3: The Heavy Python GPU Code
*Examiner asks about the exact tensor shape math inside Modal/PyTorch.*
*   **Don't say:** "I have absolutely no idea, it's AI magic."
*   **Do say:** "The exact tensor shape manipulation inside the RRDB (Residual-in-Residual Dense Blocks) is abstracted via the Real-ESRGAN pre-trained weights. My engineering focus was standardizing the data ingestion boundary—ensuring the incoming byte array was clean, formatted strictly to RGB, and that the Python container handled the CUDA handoff without locking up the Node thread."

## The Golden Pivot Formula

If you are totally trapped on syntax:
1. **Zoom out to the function's purpose:** "The exact syntax escapes me for a second, but this function's overarching role is to validate the user tier."
2. **Explain the input and output:** "It takes the HTTP request header, reads the database enum, and returns a boolean pass/fail."
3. **Bring it back to why it matters:** "Without this logic, a free user could trigger an expensive GPU task, breaking the business logic."

Examiners ultimately want to know that you understand the **logic, flow, and architecture**. They know syntax can be Googled. Prove you designed the *system*.
