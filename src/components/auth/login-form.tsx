"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setLoading(true);
    try {
      if (action === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      toast({
        title: action === 'login' ? 'Inicio de Sesión Exitoso' : 'Registro Exitoso',
        description: "Redirigiendo al dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`${action} failed`, error);
      toast({
        variant: "destructive",
        title: `Error de ${action === 'login' ? 'Inicio de Sesión' : 'Registro'}`,
        description: error.message || "Ocurrió un error. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="signup">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu dashboard de Inverapuestas Pro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Email</Label>
              <Input id="email-login" type="email" placeholder="test@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-login">Contraseña</Label>
              <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={loading} onClick={() => handleAuthAction('login')}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>Crea una nueva cuenta para empezar a analizar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signup">Email</Label>
              <Input id="email-signup" type="email" placeholder="test@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signup">Contraseña</Label>
              <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
             <Button className="w-full" disabled={loading} onClick={() => handleAuthAction('signup')}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Crear Cuenta
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
