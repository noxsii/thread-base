<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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

const warningPoints = computed(() => tm('auth.login.warningPoints') as string[])

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
  if (!uuid.value || submitting.value || !confirmed.value) return
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
  <main class="min-h-dvh bg-background px-4 py-8 sm:py-12 flex items-center justify-center">
    <Card class="w-full max-w-lg">
      <CardHeader class="space-y-3">
        <div
          class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <KeyRound class="size-6" />
        </div>
        <CardTitle class="text-center text-2xl">{{ t('auth.login.title') }}</CardTitle>
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
            class="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm break-all select-all"
          >
            {{ uuid || '…' }}
          </div>

          <p class="text-xs text-muted-foreground">{{ t('auth.login.idCaption') }}</p>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
            <Button
              type="button"
              variant="outline"
              class="w-full"
              :disabled="!uuid"
              @click="copyUuid"
            >
              <Check v-if="justCopied" class="size-4" />
              <Copy v-else class="size-4" />
              {{ justCopied ? t('auth.login.copied') : t('auth.login.copy') }}
            </Button>
            <Button
              type="button"
              variant="outline"
              class="w-full"
              :disabled="!uuid"
              @click="downloadUuid"
            >
              <Download class="size-4" />
              {{ t('auth.login.download') }}
            </Button>
          </div>
        </section>

        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>{{ t('auth.login.warningTitle') }}</AlertTitle>
          <AlertDescription>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="(point, i) in warningPoints" :key="i">{{ point }}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <label class="flex items-start gap-3 cursor-pointer select-none">
          <Checkbox v-model="confirmed" class="mt-0.5" />
          <span class="text-sm leading-snug text-foreground">
            {{ t('auth.login.confirm') }}
          </span>
        </label>

        <p v-if="errorMessage" class="text-sm text-destructive" role="alert">
          {{ errorMessage }}
        </p>
      </CardContent>

      <CardFooter>
        <Button
          class="w-full"
          size="lg"
          :disabled="submitting || !uuid || !confirmed"
          @click="start"
        >
          {{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>
