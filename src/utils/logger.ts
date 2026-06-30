type LogLevel = 'info' | 'warn' | 'error' | 'audit';

class Logger {
  private static instance: Logger;
  // In a real environment, this would toggle based on build type
  private isProduction: boolean = true; 

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  public info(message: string, data?: any) {
    console.log(this.formatMessage('info', message), data || '');
  }

  public warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message), data || '');
  }

  public error(message: string, error?: any) {
    console.error(this.formatMessage('error', message), error || '');
  }

  public audit(action: string, user: string, details?: any) {
    // In production, this would send data to a secure backend endpoint
    const msg = `USER: ${user} | ACTION: ${action}`;
    console.info(`%c ${this.formatMessage('audit', msg)}`, 'color: #059669; font-weight: bold;', details || '');
  }
}

export const logger = Logger.getInstance();