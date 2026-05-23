import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type DocsOverviewProps = {
    markdown: string;
};

type Section = {
    id: string;
    title: string;
    level: number;
};

type TocNode = {
    section: Section;
    children: TocNode[];
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function buildTree(sections: Section[]): TocNode[] {
    const roots: TocNode[] = [];
    const stack: TocNode[] = [];

    for (const section of sections) {
        const node: TocNode = { section, children: [] };

        while (
            stack.length > 0 &&
            stack[stack.length - 1].section.level >= section.level
        ) {
            stack.pop();
        }

        if (stack.length === 0) {
            roots.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
        }

        stack.push(node);
    }

    return roots;
}

function TocItem({
    node,
    activeId,
    depth = 0,
}: {
    node: TocNode;
    activeId: string;
    depth?: number;
}) {
    const hasChildren = node.children.length > 0;
    const isActive = activeId === node.section.id;

    const isChildActive = (n: TocNode): boolean => {
        if (n.section.id === activeId) {
            return true;
        }

        return n.children.some(isChildActive);
    };

    const childIsActive = node.children.some(isChildActive);
    const shouldBeOpen = depth === 0 || childIsActive || isActive;
    const [open, setOpen] = useState(shouldBeOpen);
    const prevActive = useRef(false);

    useEffect(() => {
        const nowActive = childIsActive || isActive;

        if (nowActive && !prevActive.current) {
            setOpen(true);
        }

        prevActive.current = nowActive;
    }, [childIsActive, isActive]);

    const paddingLeft = depth === 0 ? '' : depth === 1 ? 'pl-3' : 'pl-6';
    const textSize = depth >= 2 ? 'text-xs' : 'text-sm';

    return (
        <li>
            <div className="flex items-center gap-0.5">
                {hasChildren && (
                    <button
                        aria-label={open ? 'Tutup' : 'Buka'}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        onClick={() => setOpen((v) => !v)}
                        type="button"
                    >
                        <svg
                            className={`h-3 w-3 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
                            fill="currentColor"
                            viewBox="0 0 6 10"
                        >
                            <path d="M1 1l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" fill="none" />
                        </svg>
                    </button>
                )}

                <a
                    className={`flex-1 truncate rounded px-2 py-1 transition-colors ${paddingLeft} ${textSize} ${depth === 0 ? 'font-semibold' : 'font-medium'} ${
                        isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${!hasChildren ? 'ml-5' : ''}`}
                    href={`#${node.section.id}`}
                >
                    {node.section.title}
                </a>
            </div>

            {hasChildren && open && (
                <ul className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-2.5">
                    {node.children.map((child) => (
                        <TocItem
                            activeId={activeId}
                            depth={depth + 1}
                            key={child.section.id}
                            node={child}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function DocsOverview({ markdown }: DocsOverviewProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [activeId, setActiveId] = useState('');
    const tocTree = buildTree(sections);

    useEffect(() => {
        if (!contentRef.current) {
            return;
        }

        const headings = Array.from(
            contentRef.current.querySelectorAll('h1, h2, h3'),
        );

        setSections(
            headings.map((el) => ({
                id: el.id,
                title: el.textContent ?? '',
                level: Number(el.tagName[1]),
            })),
        );
    }, [markdown]);

    useEffect(() => {
        if (!contentRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);

                if (visible) {
                    setActiveId(visible.target.id);
                }
            },
            { rootMargin: '-10% 0px -85% 0px' },
        );

        contentRef.current
            .querySelectorAll('h1, h2, h3')
            .forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title="Dokumentasi Proyek" />

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                            KP
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Sistem Kantin Paramadina
                            </p>
                            <p className="text-xs text-slate-500">
                                Dokumentasi Teknis
                            </p>
                        </div>
                    </div>
                    <Link
                        className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        href="/"
                    >
                        ← Kembali ke App
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-start gap-8 xl:gap-12">

                    <aside className="sticky top-16 hidden max-h-[calc(100dvh-4.5rem)] w-64 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:block">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Daftar Isi
                            </p>
                            <nav>
                                <ul className="space-y-0.5">
                                    {tocTree.map((node) => (
                                        <TocItem
                                            activeId={activeId}
                                            key={node.section.id}
                                            node={node}
                                        />
                                    ))}
                                </ul>
                            </nav>
                    </aside>

                    <main
                        className="docs-content min-w-0 flex-1"
                        ref={contentRef}
                    >
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => (
                                    <h1 id={slugify(String(children))}>
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 id={slugify(String(children))}>
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 id={slugify(String(children))}>
                                        {children}
                                    </h3>
                                ),
                                code: ({ className, children, ...props }) => {
                                    const isBlock =
                                        className?.startsWith('language-');

                                    if (isBlock) {
                                        return (
                                            <code
                                                className={className}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    }

                                    return (
                                        <code
                                            className="inline-code"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                            remarkPlugins={[remarkGfm]}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </main>
                </div>
            </div>

            <style>{`
                .docs-content h1 { font-size: 1.875rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; scroll-margin-top: 5rem; }
                .docs-content h2 { font-size: 1.375rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #1e293b; scroll-margin-top: 5rem; }
                .docs-content h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #334155; scroll-margin-top: 5rem; }
                .docs-content p { margin-bottom: 0.875rem; line-height: 1.7; color: #475569; }
                .docs-content ul { margin-bottom: 0.875rem; padding-left: 1.5rem; list-style-type: disc; }
                .docs-content ol { margin-bottom: 0.875rem; padding-left: 1.5rem; list-style-type: decimal; }
                .docs-content li { margin-bottom: 0.25rem; color: #475569; line-height: 1.6; }
                .docs-content .inline-code { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 0.25rem; padding: 0.125rem 0.375rem; color: #0f172a; }
                .docs-content pre { background: #0f172a; border-radius: 0.5rem; padding: 1rem 1.25rem; overflow-x: auto; margin-bottom: 1rem; }
                .docs-content pre code { font-family: 'JetBrains Mono', monospace; background: none; border: none; padding: 0; color: #e2e8f0; font-size: 0.8rem; line-height: 1.6; }
                .docs-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
                .docs-content th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; color: #334155; }
                .docs-content td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; color: #475569; vertical-align: top; }
                .docs-content tr:nth-child(even) td { background: #f8fafc; }
                .docs-content blockquote { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 0.75rem 1rem; border-radius: 0 0.375rem 0.375rem 0; margin-bottom: 1rem; }
                .docs-content blockquote p { color: #1e40af; margin-bottom: 0; }
                .docs-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
                .docs-content a { color: #2563eb; text-decoration: underline; }
                .docs-content strong { font-weight: 600; color: #1e293b; }
                .docs-content del { text-decoration: line-through; color: #94a3b8; }
            `}</style>
        </div>
    );
}
