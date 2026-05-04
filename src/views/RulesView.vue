<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ScrollText, ShieldAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface RuleItem {
  title: string
  description: string
}

const router = useRouter()
const { t, tm } = useI18n()

const items = computed(() => tm('rules.items') as RuleItem[])

function back() {
  if (window.history.length > 1) router.back()
  else router.replace({ name: 'login' })
}
</script>

<template>
  <main
    class="relative min-h-dvh overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
  >
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <div
        class="absolute -top-32 -left-24 size-112 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/15"
      />
      <div
        class="absolute top-1/3 -right-24 size-104 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-600/15"
      />
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-foreground)_1px,transparent_0)] bg-size-[24px_24px] opacity-[0.04] dark:opacity-[0.06]"
      />
    </div>

    <div class="mx-auto w-full max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" class="-ml-2" @click="back">
        <ArrowLeft class="size-4" />
        {{ t('rules.back') }}
      </Button>

      <Card
        class="border-white/40 bg-white/70 shadow-2xl shadow-slate-900/5 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40 dark:supports-backdrop-filter:bg-slate-900/50"
      >
        <CardHeader class="space-y-3">
          <div
            class="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-500/30 ring-1 ring-white/40"
          >
            <ScrollText class="size-7" />
          </div>
          <CardTitle
            class="text-3xl font-semibold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            {{ t('rules.title') }}
          </CardTitle>
          <CardDescription class="text-balance">{{ t('rules.intro') }}</CardDescription>
          <p class="text-xs text-muted-foreground">
            {{ t('rules.lastUpdatedLabel') }}: {{ t('rules.lastUpdatedDate') }}
          </p>
        </CardHeader>

        <CardContent class="space-y-4">
          <ol class="space-y-3">
            <li
              v-for="(item, i) in items"
              :key="i"
              class="rounded-xl border border-border/60 bg-background/40 p-4 transition hover:border-border hover:bg-background/70"
            >
              <div class="flex gap-4">
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500/15 to-sky-500/15 text-sm font-semibold text-foreground"
                >
                  {{ i + 1 }}
                </span>
                <div class="space-y-1">
                  <h3 class="font-semibold leading-tight">{{ item.title }}</h3>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </li>
          </ol>

          <Alert
            variant="destructive"
            class="border-destructive/30 bg-destructive/5 backdrop-blur-sm"
          >
            <ShieldAlert />
            <AlertTitle>{{ t('rules.consequences.title') }}</AlertTitle>
            <AlertDescription>
              {{ t('rules.consequences.description') }}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  </main>
</template>