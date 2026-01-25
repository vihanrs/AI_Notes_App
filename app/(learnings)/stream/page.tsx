"use client";

import {useCompletion} from "@ai-sdk/react"

// in this useCompletion hooks completion automatically updates when new chunk is received from the server
export default function StreamPage() {
  const{input,handleInputChange,handleSubmit,completion,isLoading,error,setInput,stop}=useCompletion({
    api:"/api/learnings/stream",
    
  })

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && <div className="text-red-500 mb-4">{error.message}</div>}
      {isLoading && !completion && <div className="text-red-500 mb-4">Loading...</div>}
      {completion && <div className="whitespace-pre-wrap">{completion}</div>}
      <form
        onSubmit={(e)=>{
          e.preventDefault();
          setInput("");
          handleSubmit(e);
        }}
        className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-lg"
      >
        <div className="flex gap-2">
          <input
            className="flex-1 dark:bg-zinc-800 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all font-medium shadow-sm flex items-center justify-center min-w-[80px]"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}