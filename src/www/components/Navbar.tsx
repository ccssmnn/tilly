import { useState } from "react"
import { Button } from "#shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shared/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#shared/ui/dropdown-menu"
import { List } from "react-bootstrap-icons"
import { IntlProvider, T } from "#shared/intl/setup"
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
	languages?: { name: string; href: string }[]
}

function Navbar({ logo, navigation, cta, locale, languages }: NavbarProps) {
	let [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	let [langMenuOpen, setLangMenuOpen] = useState(false)
	let [mobileLangMenuOpen, setMobileLangMenuOpen] = useState(false)
	let currentLanguageEmoji = locale === "de" ? "🇩🇪" : "🇺🇸"

	return (
		<IntlProvider
			messages={locale === "de" ? messagesDe : messagesEn}
			locale={locale}
		>
			<header className="bg-background border-border sticky inset-x-0 top-0 z-50 border-b">
				<nav className="container mx-auto flex items-center justify-between px-3 py-4">
					<a href={logo.href} className="flex items-center gap-3">
						<img alt="" src="/favicon.ico" className="size-8 rounded" />
						<span className="ml-2 hidden text-xl font-bold md:block">
							{logo.text}
						</span>
					</a>
					<div className="hidden md:flex md:items-center md:gap-x-6">
						{navigation.map(item => (
							<Button key={item.name} variant="ghost" size="sm">
								<a href={item.href} target="_self">
									{item.name}
								</a>
							</Button>
						))}
						{languages && (
							<DropdownMenu open={langMenuOpen} onOpenChange={setLangMenuOpen}>
								<DropdownMenuTrigger
									render={
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setLangMenuOpen(true)}
										>
											{currentLanguageEmoji}
										</Button>
									}
								/>
								<DropdownMenuContent align="center">
									{languages.map(item => (
										<DropdownMenuItem
											key={item.name}
											render={<a href={item.href}>{item.name}</a>}
										/>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
					<div className="flex gap-3">
						{languages && (
							<DropdownMenu
								open={mobileLangMenuOpen}
								onOpenChange={setMobileLangMenuOpen}
							>
								<DropdownMenuTrigger
									render={
										<Button
											variant="ghost"
											className="md:hidden"
											size="icon"
											onClick={() => setMobileLangMenuOpen(true)}
										>
											{currentLanguageEmoji}
										</Button>
									}
								/>
								<DropdownMenuContent align="end">
									{languages.map(item => (
										<DropdownMenuItem
											key={item.name}
											render={<a href={item.href}>{item.name}</a>}
										/>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
						<Button>
							<a href={cta.href}>{cta.text}</a>
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
				<Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Menu</DialogTitle>
							<DialogDescription>
								<T k="marketing.nav.menuDescription" />
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-3">
							{navigation.map(item => (
								<Button key={item.name} variant="outline">
									<a href={item.href} target="_self">
										{item.name}
									</a>
								</Button>
							))}
						</div>
					</DialogContent>
				</Dialog>
			</header>
		</IntlProvider>
	)
}
