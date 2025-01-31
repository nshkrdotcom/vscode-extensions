```typescript
/**
 * Interface representing the expected response structure from an LLM for file operations.
 * This is a placeholder and should be adapted to match the actual LLM response format.
 * For example, if using OpenAI, define based on their API responses.
 */
export interface LLMResponse {
    content?: string; // The main text content of the response.
    // Add other fields as needed based on your LLM response structure
    // e.g., error messages, metadata, etc.
}

/**
 * Interface defining a standard LLM call function.
 * This represents how your application would interact with an LLM.
 * You'd typically use a library like 'openai' or 'google-cloud-aiplatform' under the hood.
 */
export interface LLMCaller {
    callLLM(prompt: string): Promise<LLMResponse>;
}

/**
 * Type alias for the output structure of the CodeBlockParser.
 * Each CodeBlockResult represents a parsed code block.
 */
export type CodeBlockResult = [
    path: string,      // File path (can be empty if not specified or root)
    filename: string,  // Filename (without extension, can be empty if not specified)
    extension: string, // File extension or file type identifier (e.g., 'ts', 'js', 'python', 'diff', '', etc.)
    extractedCode: string // The actual extracted code content
];

/**
 * Class for parsing code blocks from text, typically LLM responses.
 * It can identify full files, partial files, and extract code content along with file metadata.
 */
export class CodeBlockParser {

    /**
     * Regex to match code blocks, optionally with file/language hints.
     *
     * Group 1:  Optional language/file hint immediately after ``` or `````. Can be like 'typescript filename.ts', 'python', 'diff', or just a filename 'myfile.js'.
     *          This is made more flexible to accommodate various LLM output styles.
     * Group 2:  Code content inside the block.  Matches everything until the closing ``` or `````.
     *
     * The regex is global and multiline.
     * It handles both ``` and ````` style code fences.
     * Non-greedy matching is used for code content to prevent capturing across multiple blocks.
     */
    private static CODE_BLOCK_REGEX = /```(?:([\w\-\.\/\s]+)\n)?([\s\S]*?)```/g;


    /**
     * Parses the input text and extracts code blocks with file information.
     *
     * @param text The input string to parse, typically an LLM response.
     * @returns An array of CodeBlockResult arrays, each representing a parsed code block.
     *          Returns an empty array if no code blocks are found.
     */
    public parse(text: string): CodeBlockResult[] {
        const results: CodeBlockResult[] = [];
        let match;

        while ((match = CodeBlockParser.CODE_BLOCK_REGEX.exec(text)) !== null) {
            const hint = match[1] ? match[1].trim() : ''; // Language/file hint
            const codeContent = match[2] ? match[2].trim() : '';  // Extracted code
            const fileInfo = this._extractFileInfoFromHint(hint);

            results.push([
                fileInfo.path,
                fileInfo.filename,
                fileInfo.extension,
                codeContent
            ]);
        }

        return results;
    }


    /**
     * Helper function to extract file path, filename, and extension from the code block hint.
     * Handles cases where the hint might contain path, filename, extension, or just a language/type.
     *
     * Examples of hints:
     * - "typescript src/components/Button.tsx"
     * - "python my_script.py"
     * - "javascript"
     * - "diff"
     * - "myfile.config.js"
     * - "" (empty hint)
     *
     * @param hint The hint string extracted from the code block (Group 1 of regex match).
     * @returns An object containing parsed path, filename, and extension. Defaults to empty strings if parsing fails.
     * @private
     */
    private _extractFileInfoFromHint(hint: string): { path: string; filename: string; extension: string } {
        let path = '';
        let filename = '';
        let extension = '';

        if (!hint) {
            return { path, filename, extension }; // No hint provided, return empty defaults.
        }

        const parts = hint.split(/\s+/); // Split by spaces, first part could be language/type

        let filenamePart = parts.length > 1 ? parts.slice(1).join(" ") : parts[0]; // if there are spaces, join the rest as filename

        if (!filenamePart || filenamePart === parts[0]) {
            filenamePart = parts[0]; // If no spaces after potential type, use the first part as filename (or just type if no dot found later)
        }


        if (filenamePart) {
            const pathParts = filenamePart.split('/');
            filename = pathParts.pop() || ''; // Last part is filename
            path = pathParts.join('/'); // Everything before the last part is path

            if (filename) {
                const filenameParts = filename.split('.');
                if (filenameParts.length > 1) {
                    extension = filenameParts.pop() || ''; // Last part after dot is extension
                    filename = filenameParts.join('.'); // Everything before the last dot is the filename without extension
                } else {
                    filename = filenameParts[0]; // No extension found in filename
                    if (parts.length > 1) { // Check if the first part before space might be the extension/filetype when no explicit extension in filename
                        extension = parts[0]; // e.g., hint was "typescript myfilename", then typescript becomes extension
                    }
                }
            } else {
                // No filename but hint present - could be just file type like 'diff', 'javascript'
                extension = parts[0]; // Take the first part as extension if no filename could be parsed
                filename = ''; // Clear filename since it couldn't be properly identified.
                path = ''; // Clear path as well in this scenario as no clear file structure hint
            }
        } else if (parts.length > 0) {
             extension = parts[0]; // if only hint part, it is the file type (e.g. diff, text)
             filename = '';
             path = '';
        }


        // Normalize and clean up (optional, but good practice)
        extension = extension.toLowerCase(); // Extensions are usually case-insensitive

        return { path, filename, extension };
    }

    /**
     * Example method to simulate calling an LLM and parsing its response.
     * This is for demonstration and integration purposes.
     *
     * @param llmCaller An instance of an LLMCaller interface to make LLM calls.
     * @param prompt The prompt to send to the LLM.
     * @returns An array of parsed CodeBlockResults from the LLM's response.
     */
    public async processLLMResponse(llmCaller: LLMCaller, prompt: string): Promise<CodeBlockResult[][]> {
        try {
            const response = await llmCaller.callLLM(prompt);
            if (response && response.content) {
                const parsedBlocks = this.parse(response.content);
                return [parsedBlocks]; // Wrap in another array for potential multiple responses later
            } else {
                console.warn("LLM Response was empty or lacked content.");
                return [[]]; // Return empty array if no content
            }
        } catch (error) {
            console.error("Error calling LLM or processing response:", error);
            return [[]]; // Return empty array on error
        }
    }
}

// Example Usage:

// 1. Define an LLMCaller (this is a placeholder, in real app you'd use an actual LLM library)
class MockLLMCaller implements LLMCaller {
    async callLLM(prompt: string): Promise<LLMResponse> {
        console.log(`Mock LLM called with prompt: ${prompt}`);
        // Simulate LLM response (replace with actual LLM API call)
        let mockResponseContent = "";
        if (prompt.includes("file1.ts")) {
            mockResponseContent += "```typescript src/components/file1.ts\nconsole.log('Hello from file1');\n```\n";
        }
        if (prompt.includes("partial")) {
            mockResponseContent += "```javascript\n// Partial code snippet\nfunction add(a, b) {\n  return a + b;\n}\n```\n";
        }
         if (prompt.includes("multiple")) {
            mockResponseContent += "```python my_script.py\nprint(\"Hello from Python\")\n```\n";
            mockResponseContent += "```\n// No file info block\nconsole.log(\"Generic Javascript Code\");\n```\n";
        }
        if (prompt.includes("diff")) {
             mockResponseContent += "```diff file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1,1 +1,1 @@\n-Hello\n+World\n```\n";
        }
        if (prompt.includes("no-hint")) {
             mockResponseContent += "```\nconsole.log('Code with no hint');\n```\n";
        }
        if (prompt.includes("filename-only")) {
            mockResponseContent += "``` filename_only.js\nconsole.log('Filename only hint');\n```\n";
        }
         if (prompt.includes("no-ext")) {
            mockResponseContent += "``` text_file_no_extension\nThis is a text file.\n```\n";
        }


        return { content: mockResponseContent };
    }
}

async function main() {
    const parser = new CodeBlockParser();
    const llmCaller = new MockLLMCaller(); // Replace with your actual LLM caller

    const prompts = [
        "Generate content for file1.ts",
        "Provide a partial javascript code snippet",
        "Give multiple code blocks in python and javascript",
        "Show a diff example",
        "Example with no hint code block",
        "Example with filename only hint",
        "Example with file without extension hint",
        "Generate a response with no code blocks" // Example of no code blocks.
    ];

    for (const prompt of prompts) {
        console.log(`\n--- Prompt: ${prompt} ---`);
        const llmResponseBlocks = await parser.processLLMResponse(llmCaller, prompt);

        llmResponseBlocks.forEach(parsedBlocks => {
            if (parsedBlocks.length > 0) {
                parsedBlocks.forEach(block => {
                    console.log("Parsed Code Block:");
                    const [path, filename, extension, extractedCode] = block;
                    console.log(`  Path:      ${path}`);
                    console.log(`  Filename:  ${filename}`);
                    console.log(`  Extension: ${extension}`);
                    console.log("  Code:\n", extractedCode);
                    console.log("-----------------------");
                });
            } else {
                console.log("No code blocks found in LLM response.");
            }
        });
    }

     // Example parsing text directly (without LLM)
    const textToParse = `
\`\`\`typescript src/services/api.service.ts
export class ApiService {
  async fetchData() {
    // ... some API call
  }
}
\`\`\`

Some text in between

\`\`\`python utils.py
def helper_function():
  pass
\`\`\`

\`\`\`diff file_changes.diff
--- a/old_file.txt
+++ b/new_file.txt
@@ -1,1 +1,1 @@
-old content
+new content
\`\`\`

\`\`\`javascript
console.log("Just javascript snippet");
\`\`\`
`;

    console.log("\n--- Direct Text Parsing ---");
    const directParsedBlocks = parser.parse(textToParse);
    directParsedBlocks.forEach(block => {
        console.log("Parsed Code Block (Direct Parse):");
        const [path, filename, extension, extractedCode] = block;
        console.log(`  Path:      ${path}`);
        console.log(`  Filename:  ${filename}`);
        console.log(`  Extension: ${extension}`);
        console.log("  Code:\n", extractedCode);
        console.log("-----------------------");
    });
}

main().catch(console.error);
```

**Explanation of the Code:**

1.  **Interfaces:**
    *   `LLMResponse`:  A placeholder interface defining the structure of a response from an LLM.  You'll need to adapt this to match the actual JSON or data format your LLM API returns. It currently just includes a `content` string, which is the main text response from the LLM. You might add other properties like `error`, `metadata`, etc., based on your LLM.
    *   `LLMCaller`: Defines an interface for a function that calls an LLM.  This allows you to use any LLM library (like OpenAI's SDK, Google Cloud AI Platform SDK, etc.) as long as you create a class that implements this interface to make the actual LLM API calls.  This promotes decoupling and testability.

2.  **`CodeBlockResult` Type Alias:**
    *   Defines the structure of each parsed code block as a tuple (array of length 4).  This makes the output type clear and enforces structure.

3.  **`CodeBlockParser` Class:**
    *   **`CODE_BLOCK_REGEX`:**
        *   A regular expression to find code blocks within the text.
        *   It uses `\```` or `\```` to match code fences (common in Markdown).
        *   `(?:([\w\-\.\/\s]+)\n)?` is a non-capturing group that optionally captures:
            *   `[\w\-\.\/\s]+`:  One or more word characters (`\w`), hyphens, dots, forward slashes, or whitespace characters. This is designed to be flexible in capturing file/language hints that LLMs might provide after the opening code fence.
            *   `\n`: A newline character immediately after the hint (if present). This helps separate the hint from the code content.
            *   The `?` makes the whole hint group optional, so it will match blocks without hints as well.
        *   `([\s\S]*?)`: Captures the code content itself.
            *   `[\s\S]` matches any character, including newlines (important for multiline code blocks).
            *   `*?` is a non-greedy quantifier, ensuring it matches only up to the *next* closing code fence, preventing it from accidentally consuming multiple code blocks into one match.
        *   `g` flag for global matching (find all code blocks).
        *   `m` flag (optional, depending on regex engine nuances in your environment, though `[\s\S]` usually covers multiline already. You might omit `m` if not strictly necessary).
    *   **`parse(text: string): CodeBlockResult[]` Method:**
        *   The main method for parsing.
        *   Iterates through all matches found by `CODE_BLOCK_REGEX` using `exec()`.
        *   For each match:
            *   Extracts the `hint` (group 1) and `codeContent` (group 2).
            *   Calls `_extractFileInfoFromHint()` to parse the `hint` into `path`, `filename`, and `extension`.
            *   Creates a `CodeBlockResult` array and adds it to the `results` array.
        *   Returns the `results` array containing all parsed code blocks.
    *   **`_extractFileInfoFromHint(hint: string): { path: string; filename: string; extension: string }` Method:**
        *   A helper function to process the code block hint string.
        *   Splits the hint by spaces. The first part *could* be a language/type, and subsequent parts likely form the filename/path.
        *   Handles different scenarios:
            *   **No hint:** Returns empty strings for all file info parts.
            *   **Hint with filename (and potentially path/extension):**  Attempts to parse path, filename, and extension based on common file path conventions (using `/` as path separator and `.` for extension).
            *   **Hint only indicating language/type:**  If it can't parse a filename from the hint, it might treat the whole hint as the `extension` (e.g., "diff", "python" as extensions when no filename is apparent). This is a bit heuristic and you might need to adjust based on how LLMs format their responses in your specific use case.
        *   Normalizes extension to lowercase.
        *   Returns an object with `path`, `filename`, and `extension`.
    *   **`processLLMResponse(llmCaller: LLMCaller, prompt: string): Promise<CodeBlockResult[][]>` Method:**
        *   Demonstrates how to use the `CodeBlockParser` with an `LLMCaller`.
        *   Takes an `LLMCaller` instance and a `prompt`.
        *   Calls the LLM using `llmCaller.callLLM(prompt)`.
        *   Parses the `content` of the LLM response using `this.parse()`.
        *   Wraps the result in another array (as `CodeBlockResult[][]`). This outer array is for potential future extensions where you might want to handle multiple responses from a single LLM call (though in this example, we are assuming one response at a time).
        *   Includes basic error handling and console logging.

4.  **`MockLLMCaller` (Example):**
    *   A simple `class MockLLMCaller` is provided to implement the `LLMCaller` interface. This is for testing and demonstration purposes *without* needing a real LLM API key immediately.
    *   Its `callLLM` method simulates an LLM response based on the prompt provided.  You would replace this with your actual LLM API client library in a real application.

5.  **`main()` Function (Example Usage):**
    *   Creates instances of `CodeBlockParser` and `MockLLMCaller`.
    *   Defines an array of `prompts` to send to the mock LLM.
    *   Loops through the prompts, calls `parser.processLLMResponse` for each, and then prints the parsed `CodeBlockResult` arrays to the console in a formatted way for easy viewing of the extracted data.
    *   Includes an example of directly parsing a string (without going through the LLM simulation) using `parser.parse(textToParse)`.

**To use this code in a real application:**

1.  **Implement `LLMCaller`:** Replace `MockLLMCaller` with a class that actually uses your chosen LLM API library (e.g., OpenAI, Google Vertex AI, etc.) to make API calls. You would configure your API key and set up the client library in this class.
2.  **Use `CodeBlockParser`:** Instantiate `CodeBlockParser`. Instantiate your `LLMCaller` implementation.
3.  **Call `processLLMResponse` or `parse`:**
    *   If you want to get code blocks from LLM responses, use `parser.processLLMResponse(yourLLMCallerInstance, yourPrompt)`.
    *   If you have text already (not from an LLM response but containing code blocks), you can directly use `parser.parse(yourTextString)`.
4.  **Process `CodeBlockResult[][]`:** The output will be a 2D array of `CodeBlockResult`. Iterate through this array to access the `path`, `filename`, `extension`, and `extractedCode` for each parsed code block and use this information in your application as needed.

This code provides a reusable, standalone TypeScript class for parsing code blocks from text, making it adaptable to different LLM response styles and easy to integrate into your projects.