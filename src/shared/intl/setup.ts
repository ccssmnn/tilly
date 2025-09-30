import { createIntlForReact } from "@ccssmnn/intl/react"
import { messagesEn } from "./messages"

let { IntlProvider, useIntl, T, useLocale } = createIntlForReact(
	messagesEn,
	"en",
)

export { IntlProvider, useIntl, T, useLocale }
