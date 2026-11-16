import re

with open('src/components/reports/A4ReportView.tsx', 'r') as f:
    content = f.read()

replacements = {
    r'px-6 md:px-12 lg:px-16': 'px-10',
    r'pb-12 md:pb-16': 'pb-16',
    r'text-4xl md:text-5xl lg:text-6xl': 'text-5xl',
    r'text-lg md:text-2xl': 'text-2xl',
    r'p-6 md:p-8': 'p-8',
    r'grid-cols-2 md:grid-cols-3': 'grid-cols-3',
    r'p-4 md:p-5': 'p-5',
    r'text-\[9px\] md:text-\[10px\]': 'text-[10px]',
    r'text-sm md:text-base': 'text-base',
    r'grid-cols-1 md:grid-cols-2': 'grid-cols-2',
    r'flex-col sm:flex-row': 'flex-row',
    r'items-start sm:items-center': 'items-center',
    r'text-3xl md:text-4xl': 'text-4xl',
    r'mb-4 md:mb-0': 'mb-0',
    r'text-left md:text-right': 'text-right',
    r'flex-col md:flex-row': 'flex-row',
    r'w-full md:w-1/2': 'w-1/2',
    r'p-4 md:p-8': 'p-8',
    r'mt-6 md:mt-0': 'mt-0',
    r'w-full md:w-64': 'w-64',
    r'text-xl md:text-2xl': 'text-2xl',
    r'text-4xl md:text-5xl': 'text-5xl',
    r'p-6 md:p-10': 'p-10',
    r'p-10 md:p-14': 'p-14'
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

# General cleanup for any remaining simple ones
# This regex looks for "<base_class> md:<base_class>" and keeps just "<base_class>" with the md value
# Actually, the manual ones above should cover 99% of them based on the grep.

with open('src/components/reports/A4ReportView.tsx', 'w') as f:
    f.write(content)
print("Replaced responsive classes.")
