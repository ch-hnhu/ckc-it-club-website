import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StacksEditor } from "@stackoverflow/stacks-editor";
import "@stackoverflow/stacks-editor/dist/styles.css";

export interface StacksEditorHandle {
	getContent: () => string;
	setContent: (content: string) => void;
	focus: () => void;
}

interface StacksEditorWrapperProps {
	initialContent?: string;
	placeholder?: string;
	className?: string;
}

type HeadingLevel = 1 | 2 | 3;

const HEADING_ITEM_SELECTORS: Record<HeadingLevel, string> = {
	1: '[data-key="h1-btn"]',
	2: '[data-key="h2-btn"]',
	3: '[data-key="h3-btn"]',
};

const getHeadingLevelFromSelection = (
	editor: InstanceType<typeof StacksEditor>,
): HeadingLevel | null => {
	const view = editor.editorView;
	const headingType = view?.state.schema.nodes.heading;

	if (!view || !headingType) return null;

	const { doc, selection } = view.state;

	const getPositionHeadingLevel = (position: typeof selection.$from) => {
		for (let depth = position.depth; depth > 0; depth -= 1) {
			const node = position.node(depth);

			if (node.type === headingType) {
				const level = Number(node.attrs.level);
				return level === 1 || level === 2 || level === 3 ? level : null;
			}
		}

		return null;
	};

	const fromLevel = getPositionHeadingLevel(selection.$from);

	if (!fromLevel) return null;
	if (selection.empty) return fromLevel;

	const toLevel = getPositionHeadingLevel(selection.$to);
	let hasDifferentTextBlock = toLevel !== null && toLevel !== fromLevel;

	doc.nodesBetween(selection.from, selection.to, (node) => {
		if (!node.isTextblock) return;

		if (node.type === headingType) {
			const level = Number(node.attrs.level);
			if (level !== fromLevel) hasDifferentTextBlock = true;
			return false;
		}

		if (node.textContent.trim()) hasDifferentTextBlock = true;
		return false;
	});

	return hasDifferentTextBlock ? null : fromLevel;
};

const isSelectionInTable = (editor: InstanceType<typeof StacksEditor>) => {
	const view = editor.editorView;
	const schema = view?.state.schema;
	const parentType = view?.state.selection.$head.parent.type;

	if (!view || !schema || !parentType) return false;

	return [
		schema.nodes.table,
		schema.nodes.table_head,
		schema.nodes.table_body,
		schema.nodes.table_row,
		schema.nodes.table_cell,
		schema.nodes.table_header,
	].includes(parentType);
};

const StacksEditorWrapper = forwardRef<StacksEditorHandle, StacksEditorWrapperProps>(
	({ initialContent = "", placeholder = "Bạn đang nghĩ gì?", className }, ref) => {
		const outerRef = useRef<HTMLDivElement>(null);
		const innerRef = useRef<HTMLDivElement>(null);
		const editorRef = useRef<InstanceType<typeof StacksEditor> | null>(null);

		useImperativeHandle(ref, () => ({
			getContent: () => editorRef.current?.content ?? "",
			setContent: (value) => {
				if (editorRef.current) editorRef.current.content = value;
			},
			focus: () => editorRef.current?.focus(),
		}));

		useEffect(() => {
			const inner = innerRef.current;
			if (!inner) return;

			// Clear any DOM artifacts from StrictMode's first (dry-run) mount
			while (inner.firstChild) inner.removeChild(inner.firstChild);

			const editor = new StacksEditor(inner, initialContent, {
				placeholderText: placeholder,
				parserFeatures: {
					tables: true,
					extraEmphasis: true,
				},
				richTextOptions: {
					highlighting: {
						languages: [
							"bash", "shell", "sh",
							"javascript", "js",
							"typescript", "ts",
							"python", "py",
							"java",
							"c", "cpp", "c++",
							"csharp", "cs",
							"go",
							"rust",
							"ruby", "rb",
							"php",
							"swift",
							"kotlin",
							"html",
							"css", "scss", "sass",
							"sql",
							"json",
							"yaml", "yml",
							"xml",
							"markdown", "md",
							"dart",
							"r",
						],
						maxSuggestions: 6,
					},
				},
			});
			editorRef.current = editor;

			const outer = outerRef.current;

			const syncHeadingMenuState = () => {
				if (!outerRef.current || editorRef.current !== editor) return;

				const root = outerRef.current;
				const button = root.querySelector<HTMLButtonElement>(".js-heading-dropdown");

				if (!button) return;

				if (!button.dataset.defaultTitle) {
					button.dataset.defaultTitle = button.title;
					button.dataset.defaultAriaLabel = button.getAttribute("aria-label") ?? "";
				}

				const browserSelection = document.getSelection();
				const selectionNode = browserSelection?.anchorNode ?? null;
				const selectionIsInEditor = !!selectionNode && root.contains(selectionNode);
				const focusIsInEditor = !!document.activeElement && root.contains(document.activeElement);
				const headingLevel =
					selectionIsInEditor || focusIsInEditor ? getHeadingLevelFromSelection(editor) : null;

				if (headingLevel) {
					const headingLabel = `H${headingLevel}`;
					const headingTitle = `Heading ${headingLevel}`;

					button.dataset.headingLevel = String(headingLevel);
					button.dataset.headingLabel = headingLabel;
					button.title = headingTitle;
					button.setAttribute("aria-label", headingTitle);
					button.classList.add("is-selected");
				} else {
					delete button.dataset.headingLevel;
					delete button.dataset.headingLabel;
					button.title = button.dataset.defaultTitle ?? "";
					button.setAttribute("aria-label", button.dataset.defaultAriaLabel ?? "");
					button.classList.remove("is-selected");
				}

				Object.entries(HEADING_ITEM_SELECTORS).forEach(([level, selector]) => {
					const item = root.querySelector<HTMLButtonElement>(selector);
					const isActive = headingLevel === Number(level);

					item?.classList.toggle("is-selected", isActive);
					item?.setAttribute("aria-checked", String(isActive));
				});
			};

			const getTableMenuParts = () => {
				const root = outerRef.current;
				const tableDropdownButton = root?.querySelector<HTMLButtonElement>(
					'[data-key="table-dropdown"]',
				);
				const tableDropdownWrapper = tableDropdownButton?.closest<HTMLElement>(
					'[data-controller="s-popover"]',
				);
				const tableDropdownPopoverId = tableDropdownButton?.getAttribute("aria-controls");
				const tableDropdownPopover = tableDropdownPopoverId
					? tableDropdownWrapper?.querySelector<HTMLElement>(
							`#${CSS.escape(tableDropdownPopoverId)}`,
						)
					: null;

				return {
					tableDropdownButton,
					tableDropdownWrapper,
					tableDropdownPopover,
				};
			};

			const setTableDropdownOpen = (isOpen: boolean) => {
				const { tableDropdownButton, tableDropdownWrapper, tableDropdownPopover } =
					getTableMenuParts();

				tableDropdownButton?.setAttribute("aria-expanded", String(isOpen));
				tableDropdownButton?.classList.toggle("is-selected", isOpen);
				tableDropdownWrapper?.classList.toggle("is-selected", isOpen);
				tableDropdownPopover?.classList.toggle("is-visible", isOpen);

				if (isOpen) {
					tableDropdownPopover?.setAttribute("data-popper-placement", "bottom");
					tableDropdownPopover?.style.setProperty("display", "block");
					tableDropdownPopover?.style.setProperty("left", "50%");
					tableDropdownPopover?.style.setProperty("right", "auto");
					tableDropdownPopover?.style.setProperty("top", "calc(100% + 8px)");
					tableDropdownPopover?.style.setProperty("transform", "translateX(-50%)");
					tableDropdownPopover?.style.setProperty("width", "20rem");
					tableDropdownPopover?.style.setProperty("max-width", "calc(100vw - 2rem)");
					tableDropdownPopover?.style.setProperty("max-height", "min(24rem, calc(100vh - 10rem))");
					tableDropdownPopover?.style.setProperty("overflow-x", "hidden");
					tableDropdownPopover?.style.setProperty("overflow-y", "auto");
					tableDropdownPopover?.style.setProperty("overscroll-behavior", "contain");
					tableDropdownPopover?.style.setProperty("z-index", "5300");
				} else {
					tableDropdownPopover?.removeAttribute("data-popper-placement");
					tableDropdownPopover?.removeAttribute("style");
				}
			};

			const syncTableMenuState = () => {
				if (!outerRef.current || editorRef.current !== editor) return;

				const root = outerRef.current;
				const insertTableButton = root.querySelector<HTMLButtonElement>(
					'[data-key="insertTable"]',
				);
				const { tableDropdownButton, tableDropdownWrapper } = getTableMenuParts();
				const inTable = isSelectionInTable(editor);

				root.dataset.tableContext = inTable ? "inside" : "outside";

				if (
					insertTableButton &&
					tableDropdownWrapper &&
					tableDropdownWrapper.nextElementSibling !== insertTableButton
				) {
					insertTableButton.before(tableDropdownWrapper);
				}

				if (insertTableButton) {
					insertTableButton.dataset.codexInsertTable = "";
					insertTableButton.classList.toggle("d-none", inTable);
					insertTableButton.toggleAttribute("aria-hidden", inTable);
					if (inTable) insertTableButton.setAttribute("tabindex", "-1");
					else insertTableButton.removeAttribute("tabindex");
				}

				if (tableDropdownWrapper) {
					tableDropdownWrapper.dataset.codexTableMenu = "";
					tableDropdownWrapper.classList.toggle("d-none", !inTable);
					tableDropdownWrapper.toggleAttribute("aria-hidden", !inTable);
				}

				if (tableDropdownButton) {
					tableDropdownButton.classList.toggle("d-none", !inTable);
					tableDropdownButton.disabled = !inTable;
					if (inTable) tableDropdownButton.removeAttribute("disabled");
				}

				if (!inTable) {
					setTableDropdownOpen(false);
				}
			};

			let frameId = 0;
			const syncEditorMenuState = () => {
				syncHeadingMenuState();
				syncTableMenuState();
			};

			const scheduleEditorMenuSync = () => {
				cancelAnimationFrame(frameId);
				frameId = requestAnimationFrame(() => {
					syncEditorMenuState();
				});
			};

			const syncEvents = [
				"click",
				"focusin",
				"focusout",
				"input",
				"keyup",
				"mouseover",
				"mouseup",
				"pointerover",
				"pointerup",
			];
			const toolbarObserver = new MutationObserver(scheduleEditorMenuSync);

			const handleTableDropdownToggle = (event: MouseEvent | PointerEvent) => {
				if (!outerRef.current || editorRef.current !== editor) return;

				const target = event.target;
				if (!(target instanceof Element)) return;

				const { tableDropdownButton, tableDropdownPopover } = getTableMenuParts();
				const clickedTableButton = tableDropdownButton?.contains(target);

				if (clickedTableButton && isSelectionInTable(editor)) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					const isOpen = tableDropdownPopover?.classList.contains("is-visible") ?? false;
					setTableDropdownOpen(!isOpen);
				}
			};

			const handleTableDropdownClick = (event: MouseEvent) => {
				if (!outerRef.current || editorRef.current !== editor) return;

				const target = event.target;
				if (!(target instanceof Element)) return;

				const { tableDropdownPopover } = getTableMenuParts();
				const clickedTableMenuItem =
					!!tableDropdownPopover?.contains(target) &&
					!!target.closest('[role="menuitem"]');

				if (clickedTableMenuItem) {
					requestAnimationFrame(() => setTableDropdownOpen(false));
				}
			};

			syncEvents.forEach((eventName) => {
				outer?.addEventListener(eventName, scheduleEditorMenuSync, true);
			});
			outer?.addEventListener("pointerdown", handleTableDropdownToggle, true);
			outer?.addEventListener("mousedown", handleTableDropdownToggle, true);
			outer?.addEventListener("click", handleTableDropdownClick, true);
			if (outer) {
				toolbarObserver.observe(outer, {
					attributes: true,
					childList: true,
					subtree: true,
					attributeFilter: ["class", "disabled", "aria-hidden", "tabindex"],
				});
			}
			document.addEventListener("selectionchange", scheduleEditorMenuSync);
			scheduleEditorMenuSync();

			return () => {
				cancelAnimationFrame(frameId);
				toolbarObserver.disconnect();
				syncEvents.forEach((eventName) => {
					outer?.removeEventListener(eventName, scheduleEditorMenuSync, true);
				});
				outer?.removeEventListener("pointerdown", handleTableDropdownToggle, true);
				outer?.removeEventListener("mousedown", handleTableDropdownToggle, true);
				outer?.removeEventListener("click", handleTableDropdownClick, true);
				document.removeEventListener("selectionchange", scheduleEditorMenuSync);
				editor.destroy();
				editorRef.current = null;
			};
		}, []); // eslint-disable-line react-hooks/exhaustive-deps

		return (
			<div ref={outerRef} className={`so-editor-outer${className ? ` ${className}` : ""}`}>
				<div ref={innerRef} />
			</div>
		);
	},
);

StacksEditorWrapper.displayName = "StacksEditorWrapper";

export default StacksEditorWrapper;
