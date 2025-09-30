import { useState } from "react"
import { Button } from "#shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "#shared/ui/dialog"
import { List } from "react-bootstrap-icons"
import { IntlProvider } from "#shared/intl/setup"
import { messagesDe, messagesEn } from "#shared/intl/messages"

export { Navbar }

interface NavigationItem {
	name: string
	href: string
}

interface NavbarProps {
	locale: "en" | "de"
	logo: {
		text: string
		href: string
	}
	navigation: NavigationItem[]
	cta: {
		text: string
		href: string
	}
}

function Navbar({ logo, navigation, cta, locale }: NavbarProps) {
	let [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	return (
		<header className="bg-background border-border sticky inset-x-0 top-0 z-50 border-b">
			<nav className="container mx-auto flex items-center justify-between px-3 py-4">
				<Button asChild variant="ghost">
					<a href={logo.href}>
						<img alt="" src="/favicon.ico" className="size-8 rounded" />
						<span className="ml-2 text-xl font-bold">{logo.text}</span>
					</a>
				</Button>
				<div className="hidden md:flex md:gap-x-6">
					{navigation.map(item => (
						<Button key={item.name} asChild variant="ghost" size="sm">
							<a href={item.href} target="_self">
								{item.name}
							</a>
						</Button>
					))}
				</div>
				<div className="flex gap-3">
					<Button asChild>
						<a
							href={cta.href}
							className="plausible--event-name=Navbar+App+Link"
						>
							{cta.text}
						</a>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileMenuOpen(true)}
						className="md:hidden"
					>
						<List className="size-6" />
					</Button>
				</div>
			</nav>
			<IntlProvider
				messages={locale === "de" ? messagesDe : messagesEn}
				locale={locale}
			>
				<Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
					<DialogContent titleSlot={<DialogTitle>Menu</DialogTitle>}>
						<div className="flex flex-col gap-3">
							{navigation.map(item => (
								<Button key={item.name} asChild variant="outline">
									<a href={item.href} target="_self">
										{item.name}
									</a>
								</Button>
							))}
						</div>
					</DialogContent>
				</Dialog>
			</IntlProvider>
		</header>
	)
}
