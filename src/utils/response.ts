export const success = (res: any, message = 'Success', data: any = {}, status = 200) =>
  res.status(status).json({ success: true, message, data });

export const fail = (res: any, message = 'Something went wrong', status = 500, data: any = {}) =>
  res.status(status).json({ success: false, message, data });
