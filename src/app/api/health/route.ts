import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TableName } from '@/helpers/string_const/tables'

export async function GET(request: NextRequest) {
  console.log('🏥 Health check API called')
  
  try {
    const supabase = await createClient()
    
    // Test basic database connectivity by checking table existence
    const tables = [
      TableName.COMPANIES,
      TableName.USERS,
      TableName.CHATBOTS,
      TableName.DATA_SOURCES,
      TableName.CHAT_SESSIONS,
      TableName.CHAT_MESSAGES,
      TableName.INTEGRATIONS,
      TableName.API_KEYS,
      TableName.CHATBOT_DATA_SOURCES
    ]

    const results = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          return {
            table: tableName,
            status: error ? 'error' : 'ok',
            count: count || 0,
            error: error?.message
          }
        } catch (err) {
          return {
            table: tableName,
            status: 'error',
            count: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      })
    )

    const hasErrors = results.some(result => result.status === 'error')
    
    return NextResponse.json({
      success: !hasErrors,
      status: hasErrors ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: results
      }
    })
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false
        }
      },
      { status: 500 }
    )
  }
}
