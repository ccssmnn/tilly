import { useRef, useEffect } from "react"

export { ScrollIntoView }

function ScrollIntoView(props: { trigger: unknown }) {
	let scrollTargetRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [props.trigger])

	return <div ref={scrollTargetRef} />
}
