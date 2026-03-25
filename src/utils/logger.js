/**
 * Production-safe logger
 * - DEV: logs to console
 * - PROD: sends ERROR/FATAL to Supabase system_logs table
 */

import { supabase, isSupabaseReady } from '../services/supabaseClient'

const IS_DEV = import.meta.env.DEV

function _consoleSafe (level, message, metadata) {
  if (!IS_DEV) return // Silent in production
  const fn = level === 'ERROR' || level === 'FATAL' ? console.error : level === 'WARN' ? console.warn : console.log
  fn(`[${level}]`, message, metadata || '')
}

async function _persistLog (level, message, metadata) {
  if (!isSupabaseReady()) return
  try {
    await supabase.from('system_logs').insert({
      level,
      message: String(message).slice(0, 500), // Prevent oversized logs
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {}
    })
  } catch {
    // Fail silently — logging should never crash the app
  }
}

const logger = {
  info (message, metadata) {
    _consoleSafe('INFO', message, metadata)
  },

  warn (message, metadata) {
    _consoleSafe('WARN', message, metadata)
  },

  error (message, metadata) {
    _consoleSafe('ERROR', message, metadata)
    _persistLog('ERROR', message, metadata)
  },

  fatal (message, metadata) {
    _consoleSafe('FATAL', message, metadata)
    _persistLog('FATAL', message, metadata)
  }
}

export default logger
