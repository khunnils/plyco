import { createProgram, printCliError } from "./program.js"

try {
  await createProgram().parseAsync(process.argv)
} catch (error) {
  printCliError(error)
  process.exit(1)
}
