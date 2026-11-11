/** Whether a rejection is antd's form.validateFields() one: the form already shows those errors. */
export const isFormValidationError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "errorFields" in error;
