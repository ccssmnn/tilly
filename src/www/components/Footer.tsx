import { Github, Twitter, Instagram } from "react-bootstrap-icons"

export { Footer }

interface Props {
	navigation: {
		main: { name: string; href: string }[]
		social: { name: string; href: string; icon: string }[]
		languages?: { name: string; href: string }[]
	}
	company: {
		name: string
	}
}

let iconMap = {
	Twitter,
	Github,
	Instagram,
}

function Footer({ navigation, company }: Props) {
	return (
		<footer className="bg-background border-border border-t">
			<div className="container mx-auto px-6 py-12 md:px-8">
				<nav
					aria-label="Footer"
					className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm"
				>
					{navigation.main.map(item => (
						<a
							key={item.name}
							href={item.href}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							{item.name}
						</a>
					))}
				</nav>
				{navigation.languages && (
					<div className="mt-6 flex justify-center gap-x-4">
						{navigation.languages.map((item, index) => (
							<span key={item.name} className="flex items-center gap-x-4">
								{index > 0 && <span className="text-muted-foreground">•</span>}
								<a
									href={item.href}
									className="text-muted-foreground hover:text-foreground text-sm transition-colors"
								>
									{item.name}
								</a>
							</span>
						))}
					</div>
				)}
				<div className="mt-8 flex justify-center gap-x-6">
					{navigation.social.map(item => {
						let IconComponent = iconMap[item.icon as keyof typeof iconMap]
						return (
							<a
								key={item.name}
								href={item.href}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								<span className="sr-only">{item.name}</span>
								<IconComponent className="h-5 w-5" />
							</a>
						)
					})}
				</div>
				<p className="text-muted-foreground mt-8 text-center text-sm">
					&copy; {new Date().getFullYear()} {company.name}. All rights reserved.
				</p>
			</div>
		</footer>
	)
}
