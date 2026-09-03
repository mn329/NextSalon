// 型定義
// コンポーネント名+Propsの形式で型定義
type SectionHeadingProps = {
    eyebrow?: string;
    title?: string;
    description?: string;
}

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm font-medium tracking-[0.32em] text-rose-600 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-8 text-base leading-7 text-slate-600">{description}</p>
      </div>
    )
  }
