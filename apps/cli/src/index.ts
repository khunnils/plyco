import { createProgram, isCliHelpExit, printCliError } from "./program.js"

try {
  await createProgram({ exitOverride: true }).parseAsync(process.argv)
} catch (error) {
  if (isCliHelpExit(error)) {
    process.exit(0)
  }

  printCliError(error)
  process.exit(1)
}
