import { NextResponse } from 'next/server';

/**
 * Simple endpoint to test environment variable access
 * This helps debug issues with environment variables not being properly loaded
 */
export async function GET() {
  // Check for various environment variables and log their presence
  const falKey = process.env.FAL_KEY;
  const nextPublicFalKey = process.env.NEXT_PUBLIC_FAL_KEY;
  
  console.log('🔍 [ENV-TEST] Environment variable check:');
  console.log('🔍 [ENV-TEST] FAL_KEY present:', falKey ? 'Yes' : 'No');
  console.log('🔍 [ENV-TEST] FAL_KEY length:', falKey ? falKey.length : 0);
  console.log('🔍 [ENV-TEST] NEXT_PUBLIC_FAL_KEY present:', nextPublicFalKey ? 'Yes' : 'No');
  console.log('🔍 [ENV-TEST] NEXT_PUBLIC_FAL_KEY length:', nextPublicFalKey ? nextPublicFalKey.length : 0);
  
  // List all environment variables that start with FAL or NEXT_PUBLIC_FAL
  const envVars = Object.keys(process.env)
    .filter(key => key.startsWith('FAL') || key.startsWith('NEXT_PUBLIC_FAL'))
    .map(key => ({ key, present: !!process.env[key], length: process.env[key]?.length || 0 }));
  
  console.log('🔍 [ENV-TEST] All FAL-related environment variables:', envVars);
  
  // Return the information (without revealing actual keys)
  return NextResponse.json({
    falKeyPresent: !!falKey,
    falKeyLength: falKey?.length || 0,
    nextPublicFalKeyPresent: !!nextPublicFalKey,
    nextPublicFalKeyLength: nextPublicFalKey?.length || 0,
    allFalEnvVars: envVars.map(v => v.key)
  });
}
