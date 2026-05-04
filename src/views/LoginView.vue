<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { signInWithUuid } = useAuth()

const deviceUuid = useDeviceUuidStore()
const { uuid } = storeToRefs(deviceUuid)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(() => {
  deviceUuid.ensure()
})

async function start() {
  if (!uuid.value || submitting.value) return
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

async function copyUuid() {
  if (!uuid.value) return
  await navigator.clipboard.writeText(uuid.value)
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-background p-6">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>{{ t('auth.login.title') }}</CardTitle>
        <CardDescription>{{ t('auth.login.subtitle') }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Button
          variant="outline"
          class="w-full justify-start font-mono"
          :title="t('auth.login.copyHint')"
          @click="copyUuid"
        >
          {{ uuid || '…' }}
        </Button>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </CardContent>

      <CardFooter>
        <Button class="w-full" size="lg" :disabled="submitting || !uuid" @click="start">
          {{ submitting ? t('auth.login.submitting') : t('auth.login.submit') }}
        </Button>
      </CardFooter>
    </Card>
  </main>
</template>