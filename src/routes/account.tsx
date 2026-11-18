import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, LogOut, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { EmptyState, PageHeading, PassportCard } from "@/components/passport-ui";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/account")({
  head: () => pageHead("Akun Saya", "Kelola profil, alamat, dan perangkat tersimpan di akun demo."),
  component: Account,
});
function Account() {
  const { user, profile, setProfile, saved, devices, signOut } = useDemo();
  const [phone, setPhone] = useState(profile.phone),
    [address, setAddress] = useState(profile.address);
  return (
    <main className="page-container reading-screen py-9">
      <PageHeading
        title="Akun Saya"
        subtitle={user ? `${user.name} · Akun demo` : "Profil dan pilihan perangkat Anda."}
      />
      {user ? (
        <>
          <div className="grid gap-10 md:grid-cols-2">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setProfile({ phone, address });
                toast.success("Profil demo disimpan");
              }}
            >
              <h2 className="text-lg font-semibold">Kontak dan alamat</h2>
              <label className="field">
                Nomor telepon
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="field">
                Alamat serah terima
                <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <Button type="submit" className="h-12">
                Simpan profil
              </Button>
            </form>
            <section>
              <h2 className="text-lg font-semibold">Privasi Anda</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Nomor telepon dan alamat tidak muncul pada paspor publik. Serial perangkat
                disamarkan, tetapi riwayat teknis tetap terlihat.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Data akun hanya untuk sesi demo. KYC dan OTP belum terhubung, jangan isi data
                sensitif.
              </p>
              <Button variant="outline" className="mt-6 h-12" asChild>
                <Link to="/login">
                  Ganti peran demo
                  <ArrowRight />
                </Link>
              </Button>
              <Button variant="ghost" className="mt-6 h-12" onClick={signOut}>
                <LogOut />
                Keluar
              </Button>
            </section>
          </div>
        </>
      ) : (
        <EmptyState title="Masuk untuk mengelola profil Anda.">
          <Button asChild>
            <Link to="/login">Masuk</Link>
          </Button>
        </EmptyState>
      )}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <Heart className="size-5 text-brand" />
          Perangkat tersimpan ({saved.length})
        </h2>
        {saved.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {devices
              .filter((d) => saved.includes(d.id))
              .map((d) => (
                <PassportCard key={d.id} device={d} />
              ))}
          </div>
        ) : (
          <p className="text-base text-muted-foreground">Belum ada perangkat tersimpan.</p>
        )}
      </section>
    </main>
  );
}
