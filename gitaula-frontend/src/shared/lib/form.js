export function fieldProps(form, name) {
  const { ref, ...field } = form.register(name);
  return {
    ...field,
    inputRef: ref,
    error: Boolean(form.formState.errors[name]),
    helperText: form.formState.errors[name]?.message,
  };
}
