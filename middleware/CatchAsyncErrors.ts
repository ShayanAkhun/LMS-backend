import  {Response,Request,NextFunction} from "express";
export const CatchAsyncErrors =
  (theFunc: any) => (res: Request, req: Request, next: NextFunction) => {

    Promise.resolve(theFunc(req, res, next)).catch(next)
  };