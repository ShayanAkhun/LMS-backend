class ErrorHandler extends Error {
    statusCode: Number;
    constructor(message: any, statusCode: Number) {
        super(message);
        this.statusCode = statusCode;

        ErrorHandler.captureStackTrace(this,this.constructor)
    }
}
export default ErrorHandler;
