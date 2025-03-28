import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAppDescription(originalDescription: string): Promise<string> {
  if (!originalDescription) {
    throw new Error('No description provided')
  }

  try {
    const prompt = `Please analyze this app description and create a structured summary with the following sections:
1. Purpose of the app
2. Key features
3. Pain points being solved
4. Ideal customer profiles

Here's the app description to analyze:
${originalDescription}

Please format the response in a clear, readable way with section headers and bullet points where appropriate. And return only the result and no additional commentary and no title or introduction.`

    console.log('Generating enhanced description with OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const enhancedDescription = response.choices[0].message.content
    if (!enhancedDescription) {
      throw new Error('OpenAI returned empty response')
    }

    console.log('Successfully generated enhanced description')
    return enhancedDescription
  } catch (error) {
    console.error('Error generating app description:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate app description: ${error.message}`)
    }
    throw new Error('Failed to generate app description')
  }
}
