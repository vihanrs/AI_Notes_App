import z from "zod";

export const recipeSchema = z.object({
    recipe: z.object({
        name: z.string().describe("Name of the recipe"),
        ingredients: z.array(
            z.object({
                name: z.string().describe("Name of the ingredient"),
                amount: z.string().describe("Amount of the ingredient"),
            })
        ).describe("Ingredients for the recipe"),
        steps: z.array(z.string()).describe("Instructions for the recipe"),
    }).describe("Recipe"),
});