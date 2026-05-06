import noFeaturePartComposition from "./rules/no-feature-part-composition.js"
import noLocalSubcomponents from "./rules/no-local-subcomponents.js"
import noWidgetComposition from "./rules/no-widget-composition.js"
import noUtilityDefinitionsInUiModules from "./rules/no-utility-definitions-in-ui-modules.js"
import noDeepFeatureImports from "./rules/no-deep-feature-imports.js"
import noLooseFeatureModuleImports from "./rules/no-loose-feature-module-imports.js"
import onlyScreensAndWidgetsMayImportParts from "./rules/only-screens-and-widgets-may-import-parts.js"
import onlyRoutesMayImportScreens from "./rules/only-routes-may-import-screens.js"
import onlyRouterMayImportHandlers from "./rules/only-router-may-import-handlers.js"
import onlyHandlersMayImportOperations from "./rules/only-handlers-may-import-operations.js"
const plugin = {
	meta: {
		name: "eslint-plugin-architecture",
		version: "0.1.0",
	},
	rules: {
		"no-feature-part-composition": noFeaturePartComposition,
		"no-local-subcomponents": noLocalSubcomponents,
		"no-widget-composition": noWidgetComposition,
		"no-utility-definitions-in-ui-modules": noUtilityDefinitionsInUiModules,
		"no-deep-feature-imports": noDeepFeatureImports,
		"no-loose-feature-module-imports": noLooseFeatureModuleImports,
		"only-screens-and-widgets-may-import-parts":
			onlyScreensAndWidgetsMayImportParts,
		"only-routes-may-import-screens": onlyRoutesMayImportScreens,
		"only-router-may-import-handlers": onlyRouterMayImportHandlers,
		"only-handlers-may-import-operations": onlyHandlersMayImportOperations,
	},
}
export default plugin
