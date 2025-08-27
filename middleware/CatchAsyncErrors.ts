import  {Response,Request,NextFunction} from "express";
export const CatchAsyncErrors =
  (theFunc: any) => (res: Response, req: Request, next: NextFunction) => {

    Promise.resolve(theFunc(res, req,  next)).catch(next)
  };