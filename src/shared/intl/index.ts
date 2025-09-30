import { createIntlForReact } from "@ccssmnn/intl/react"
import { messagesEn } from "./messages"

export { IntlProvider, useIntl, T } from "./setup"

let {
	IntlProvider: BaseIntlProvider,
	useIntl: baseUseIntl,
	T: BaseT,
} = createIntlForReact(messagesEn, "en")

export { BaseIntlProvider, baseUseIntl, BaseT }
