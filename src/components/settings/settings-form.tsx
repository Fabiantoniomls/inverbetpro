"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { UserSettings } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

const defaultSettings: UserSettings = {
    initialBankroll: 1000,
    preferredStakingModel: 'Kelly Fraccionario',
    kellyFraction: 0.25,
    fixedStakeAmount: 20,
    percentageStakeAmount: 2
}

export function SettingsForm() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        async function fetchSettings() {
            if (!user) return
            setIsLoading(true)
            try {
                const settingsRef = doc(db, 'userSettings', user.uid)
                const docSnap = await getDoc(settingsRef)
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as UserSettings)
                } else {
                    // If no settings exist, initialize with defaults
                    setSettings(defaultSettings)
                }
            } catch (error) {
                console.error("Error fetching user settings:", error)
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la configuración.' })
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [user, toast])

    const handleSave = async () => {
        if (!user || !settings) return
        setIsSaving(true)
        try {
            const settingsRef = doc(db, 'userSettings', user.uid)
            await setDoc(settingsRef, settings, { merge: true })
            toast({ title: 'Configuración Guardada', description: 'Tus preferencias han sido actualizadas.' })
        } catch (error) {
            console.error("Error saving user settings:", error)
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' })
        } finally {
            setIsSaving(false)
        }
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSettings(prev => prev ? { ...prev, [name]: parseFloat(value) || 0 } : null);
    };

    const handleSelectChange = (value: 'Fijo' | 'Porcentual' | 'Kelly Fraccionario') => {
        setSettings(prev => prev ? { ...prev, preferredStakingModel: value } : null);
    };

    if (isLoading || !settings) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Capital (Staking)</CardTitle>
                <CardDescription>
                    Configura tu bankroll y cómo se debe calcular el tamaño de tus apuestas.
                    Estos valores se usarán en la Calculadora de Stake.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="initialBankroll">Bankroll Inicial ($)</Label>
                        <Input
                            id="initialBankroll"
                            name="initialBankroll"
                            type="number"
                            placeholder="1000"
                            value={settings.initialBankroll}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="preferredStakingModel">Modelo de Staking Preferido</Label>
                        <Select value={settings.preferredStakingModel} onValueChange={handleSelectChange}>
                            <SelectTrigger id="preferredStakingModel">
                                <SelectValue placeholder="Selecciona un modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Kelly Fraccionario">Kelly Fraccionario</SelectItem>
                                <SelectItem value="Porcentual">Porcentual</SelectItem>
                                <SelectItem value="Fijo">Fijo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {settings.preferredStakingModel === 'Kelly Fraccionario' && (
                        <div className="space-y-2">
                            <Label htmlFor="kellyFraction">Fracción de Kelly (ej. 0.25 para 1/4)</Label>
                            <Input
                                id="kellyFraction"
                                name="kellyFraction"
                                type="number"
                                step="0.01"
                                placeholder="0.25"
                                value={settings.kellyFraction}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}
                    {settings.preferredStakingModel === 'Porcentual' && (
                        <div className="space-y-2">
                            <Label htmlFor="percentageStakeAmount">Porcentaje del Bankroll (%)</Label>
                            <Input
                                id="percentageStakeAmount"
                                name="percentageStakeAmount"
                                type="number"
                                step="0.5"
                                placeholder="2"
                                value={settings.percentageStakeAmount}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}
                     {settings.preferredStakingModel === 'Fijo' && (
                        <div className="space-y-2">
                            <Label htmlFor="fixedStakeAmount">Stake Fijo ($)</Label>
                            <Input
                                id="fixedStakeAmount"
                                name="fixedStakeAmount"
                                type="number"
                                placeholder="20"
                                value={settings.fixedStakeAmount}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
