import { isMac } from "#app/hooks/use-pwa"
import { BoxArrowUp, Share } from "react-bootstrap-icons"

export { PlatformShareIcon }

function PlatformShareIcon() {
	return isMac() ? <BoxArrowUp /> : <Share />
}
