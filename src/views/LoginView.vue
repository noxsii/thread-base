<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n, Translation as I18nT } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { Check, Copy, Download, KeyRound, ShieldAlert } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useDeviceUuidStore } from '@/stores/deviceUuid'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

const router = useRouter()
const route = useRoute()
const { t, tm } = useI18n()
const { signInWithUuid } = useAuth()

const deviceUuid = useDeviceUuidStore()
const { uuid } = storeToRefs(deviceUuid)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const justCopied = ref(false)
const confirmed = ref(false)
const rulesAccepted = ref(false)
const canSubmit = computed(
  () => !!uuid.value && confirmed.value && rulesAccepted.value && !submitting.value,
)

const warningPoints = computed(() => tm('auth.login.warningPoints') as string[])

useHead({
  title: () => t('auth.login.title'),
})

onMounted(() => {
  deviceUuid.ensure()
})

async function copyUuid() {
  if (!uuid.value) return
  await navigator.clipboard.writeText(uuid.value)
  justCopied.value = true
  setTimeout(() => (justCopied.value = false), 1500)
}

function downloadUuid() {
  if (!uuid.value) return
  const blob = new Blob([uuid.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `thread-base-user-id.txt`
  a.click()
  URL.revokeObjectURL(url)
}

async function start() {
  if (!canSubmit.value || !uuid.value) return
  submitting.value = true
  errorMessage.value = null
  try {
    await signInWithUuid(uuid.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('auth.login.unknownError')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main
    class="relative min-h-dvh overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:py-12 flex items-center justify-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
  >
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <div
        class="absolute -top-32 -left-24 size-112 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-600/20"
      />
      <div
        class="absolute top-1/3 -right-24 size-104 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-600/20"
      />
      <div
        class="absolute -bottom-32 left-1/3 size-120 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-600/15"
      />
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-foreground)_1px,transparent_0)] bg-size-[24px_24px] opacity-[0.04] dark:opacity-[0.06]"
      />
    </div>

    <Card
      class="w-full max-w-lg border-white/40 bg-white/70 shadow-2xl shadow-slate-900/5 backdrop-blur-xl supports-backdrop-filter:bg-white/60 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40 dark:supports-backdrop-filter:bg-slate-900/50"
    >
      <CardHeader class="space-y-3">
        <div
          class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-500/30 ring-1 ring-white/40"
        >
          <KeyRound class="size-7" />
        </div>
        <CardTitle
          class="text-center text-3xl font-semibold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          {{ t('auth.login.title') }}
        </CardTitle>
        <CardDescription class="text-center text-balance">
          {{ t('auth.login.subtitle') }}
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <section class="space-y-2">
          <p class="text-sm font-medium text-foreground">
            {{ t('auth.login.idLabel') }}
          </p>

          <div
            class="group relative rounded-xl border border-border/70 bg-linear-to-br from-muted/60 to-muted/20 px-4 py-4 font-mono text-sm tracking-wide break-all select-all shadow-inner"
          >
            <div
              class="pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-foreground/15 to-transparent"
            />
            {{ uuid || '…' }}
          </div>

          <p class="text-xs text-muted-foreground">{{ t('auth.login.idCaption') }}</p>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
            <Button
              type="button"
              variant="outline"
              class="w-full bg-white/60 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5"
              :disabled="!uuid"
              @click="copyUuid"
            >
              <Check v-if="justCopied" class="size-4 text-emerald-500" />
              <Copy v-else class="size-4" />
              {{ justCopied ? t('auth.login.copied') : t('auth.login.copy') }}
            </Button>
            <Button
              type="button"
              variant="outline"
              class="w-full bg-white/60 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5"
              :disabled="!uuid"
              @click="downloadUuid"
            >
              <Download class="size-4" />
              {{ t('auth.login.download') }}
            </Button>
          </div>
        </section>

        <Alert
          variant="destructive"
          class="border-destructive/30 bg-destructive/5 backdrop-blur-sm"
        >
          <ShieldAlert />
          <AlertTitle>{{ t('auth.login.warningTitle') }}</AlertTitle>
          <AlertDescription>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="(point, i) in warningPoints" :key="i">{{ point }}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div class="space-y-2">
          <label
            class="flex items-start gap-3 cursor-pointer select-none rounded-lg border border-border/60 bg-background/40 px-3 py-3 transition hover:border-border hover:bg-background/70"
          >
            <Checkbox v-model="confirmed" class="mt-0.5" />
            <span class="text-sm leading-snug text-foreground">
              {{ t('auth.login.confirm') }}
            </span>
          </label>

          <label
            class="flex items-start gap-3 cursor-pointer select-none rounded-lg border border-border/60 bg-background/40 px-3 py-3 transition hover:border-border hover:bg-background/70"
          >
            <Checkbox v-model="rulesAccepted" class="mt-0.5" />
            <span class="text-sm leading-snug text-foreground">
              <I18nT keypath="auth.login.rulesAccept" tag="span" scope="global">
                <template #rules>
                  <RouterLink
                    :to="{ name: 'rules' }"
                    target="_blank"
                    class="font-medium text-primary underline-offset-4 hover:underline"
                    @click.stop
                  >
                    {{ t('auth.login.rulesLink') }}
                  </RouterLink>
                </template>
              </I18nT>
            </span>
          </label>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive" role="alert">
          {{ errorMessage }}
        </p>
      </CardContent>

      <CardFooter>
        <Button
          class="w-full bg-linear-to-r from-violet-600 via-fuchsia-600 to-sky-600 text-white shadow-lg shadow-violet-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-600/40 hover:opacity-100 disabled:translate-y-0 disabled:shadow-none"
          size="lg"
          :disabled="!canSubmit"
          @click="start"
        >
          {{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>
