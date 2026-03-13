import noFeaturePartComposition from "./rules/no-feature-part-composition.js"
import noLocalPartSubcomponents from "./rules/no-local-part-subcomponents.js"
import noDeepFeatureImports from "./rules/no-deep-feature-imports.js"
import onlyScreensAndWidgetsMayImportParts from "./rules/only-screens-and-widgets-may-import-parts.js"
import onlyRoutesMayImportScreens from "./rules/only-routes-may-import-screens.js"
import onlyUseCasesMayComposeOperations from "./rules/only-use-cases-may-compose-operations.js"

const plugin = {
	meta: {
		name: "eslint-plugin-architecture",
		version: "0.1.0",
	},
	rules: {
		"no-feature-part-composition": noFeaturePartComposition,
		"no-local-part-subcomponents": noLocalPartSubcomponents,
		"no-deep-feature-imports": noDeepFeatureImports,
		"only-screens-and-widgets-may-import-parts": onlyScreensAndWidgetsMayImportParts,
		"only-routes-may-import-screens": onlyRoutesMayImportScreens,
		"only-use-cases-may-compose-operations": onlyUseCasesMayComposeOperations,
	},
}

export default plugin
