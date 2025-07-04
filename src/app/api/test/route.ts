import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Test API route called')
  
  return NextResponse.json({
    success: true,
    message: 'Test API route is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('🔍 Test POST API route called')
  
  try {
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Test POST API route is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💥 Test POST error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error parsing request body',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
} 