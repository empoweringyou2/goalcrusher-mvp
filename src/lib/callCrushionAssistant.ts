import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function sendToCrushion(userInput: string, userId: string, threadId?: string) {
  try {
    // Create thread (first-time only)
    const thread = threadId
      ? { id: threadId }
      : await openai.beta.threads.create();

    // Add user message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userInput,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_msWO7BoslUd8ht1iyIvRmPdq", // Replace with your real Assistant ID
    });

    // Poll until done
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loops

    while (runStatus !== "completed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      runStatus = check.status;
      attempts++;

      console.log(`Run status: ${runStatus} (attempt ${attempts})`);

      if (runStatus === "requires_action") {
        // GPT wants to call a function!
        const toolCalls = check.required_action?.submit_tool_outputs?.tool_calls || [];
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          try {
            // Parse the function arguments
            const functionArgs = JSON.parse(toolCall.function.arguments);
            console.log("Tool call function:", toolCall.function.name);
            console.log("Tool call args:", functionArgs);
            
            // Add the user_id to the function arguments
            const augmentedArgs = {
              ...functionArgs,
              user_id: userId
            };

            // Enhanced title validation for create_task function
            if (toolCall.function.name === "create_task") {
              // More robust title validation
              let title = augmentedArgs.title;
              
              // Check if title is missing, null, undefined, empty, or not a string
              if (!title || typeof title !== 'string' || title.trim() === "") {
                console.warn("Invalid or missing title detected, using default:", title);
                augmentedArgs.title = "New Task from AI Assistant";
              } else {
                // Ensure title is properly trimmed and not just whitespace
                const trimmedTitle = title.trim();
                if (trimmedTitle === "") {
                  console.warn("Title was only whitespace, using default");
                  augmentedArgs.title = "New Task from AI Assistant";
                } else {
                  augmentedArgs.title = trimmedTitle;
                }
              }
              
              console.log("Final task title being sent:", augmentedArgs.title);
            }
            
            // Call your Supabase Edge Function
            const result = await fetch("https://opcqlgrzyxrojzmflbez.functions.supabase.co/create_task", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify(augmentedArgs),
            });

            const resultJson = await result.json();
            console.log("Supabase function result:", resultJson);

            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(resultJson),
            });
          } catch (error) {
            console.error('Error calling function:', error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: "Failed to execute function" }),
            });
          }
        }

        // Send the results back to GPT
        await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs,
        });
      }

      if (runStatus === "failed") {
        const failedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        console.error("Assistant run failed:", failedRun);
        throw new Error(`Assistant run failed: ${failedRun.last_error?.message || 'Unknown error'}`);
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error("Assistant run timed out");
    }

    // Get final response with detailed logging
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    console.log("=== FULL MESSAGES DEBUG ===");
    console.log("Total messages in thread:", messages.data.length);
    console.log("All messages:", messages.data.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at
    })));
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(m => m.role === "assistant");
    console.log("Assistant messages found:", assistantMessages.length);
    
    if (assistantMessages.length === 0) {
      console.error("No assistant messages found in thread!");
      return { 
        reply: "⚠️ Crushion didn't send any response. Check console for details.", 
        threadId: thread.id 
      };
    }
    
    const lastAssistantMessage = assistantMessages[0]; // Most recent first
    console.log("Last assistant message:", lastAssistantMessage);
    
    if (lastAssistantMessage.content[0].type === 'text') {
      const replyText = lastAssistantMessage.content[0].text.value;
      console.log("Extracted reply text:", replyText);
      
      return { 
        reply: replyText, 
        threadId: thread.id 
      };
    } else {
      console.error("Unexpected message type from assistant:", lastAssistantMessage.content[0].type);
      return { 
        reply: "⚠️ Crushion sent an unexpected message format.", 
        threadId: thread.id 
      };
    }
  } catch (error) {
    console.error('Error communicating with Crushion:', error);
    throw error;
  }
}

// Helper function to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

// Fallback function for when OpenAI is not configured
export function getFallbackResponse(userInput: string): { reply: string; threadId?: string } {
  const responses = [
    "🎯 That's an excellent goal! Let me help you break it down into actionable steps. What's your target timeline for achieving this?",
    "✨ I love your ambition! To create the perfect plan, tell me more about what success looks like for this goal.",
    "🚀 Great choice! This goal has real potential. Let's start by identifying the key milestones you'll need to hit along the way.",
    "💪 You're thinking big - I like that! To make this happen, we should break it into smaller, manageable chunks. What's the first step you think you need to take?",
    "🌟 This goal aligns perfectly with your growth mindset! Let me suggest some strategies that have worked for others with similar aspirations.",
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    reply: randomResponse + "\n\n*Note: This is a simulated response. Connect your OpenAI API key to unlock Crushion's full AI capabilities!*",
  };
}