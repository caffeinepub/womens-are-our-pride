import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { Edit2, Info, Phone, Plus, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contact } from "../backend";
import AppNav from "../components/AppNav";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddContact,
  useDeleteContact,
  useGetContacts,
  useUpdateContact,
} from "../hooks/useQueries";

const emptyForm = { name: "", phone: "", note: "" };

export default function ContactsPage() {
  const { identity } = useInternetIdentity();
  const router = useRouter();
  useEffect(() => {
    if (!identity) router.navigate({ to: "/" });
  }, [identity, router]);

  const { data: contacts = [], isLoading } = useGetContacts();
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, note: c.note });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      if (editing) {
        await updateContact.mutateAsync({ ...form, id: editing.id });
        toast.success("Contact updated");
      } else {
        await addContact.mutateAsync({ ...form, id: "" });
        toast.success("Contact added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save contact");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact.mutateAsync(id);
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  if (!identity) return null;

  return (
    <div className="min-h-screen bg-light-bg">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy">Trusted Contacts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              These people will be notified in an emergency
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-teal text-white hover:bg-teal/90"
            data-ocid="contacts.add.button"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Contact
          </Button>
        </div>
        <div className="bg-teal/10 border border-teal/20 rounded-xl p-4 flex gap-3 mb-6">
          <Info className="w-5 h-5 text-teal shrink-0 mt-0.5" />
          <p className="text-sm text-teal/90">
            When SOS triggers, these contacts will receive your tracking link
            automatically.
          </p>
        </div>
        {isLoading && (
          <div className="space-y-3" data-ocid="contacts.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-card h-20 animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && contacts.length === 0 && (
          <div
            className="bg-white rounded-2xl p-12 shadow-card text-center"
            data-ocid="contacts.empty_state"
          >
            <Users className="w-12 h-12 text-teal/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No contacts yet. Add trusted contacts to notify in an emergency.
            </p>
          </div>
        )}
        <div className="space-y-3" data-ocid="contacts.list">
          {contacts.map((contact, idx) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4"
              data-ocid={`contacts.item.${idx + 1}`}
            >
              <div className="w-11 h-11 rounded-full bg-teal flex items-center justify-center text-white font-bold shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy">{contact.name}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {contact.phone}
                </div>
                {contact.note && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {contact.note}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(contact)}
                  className="h-8 w-8 text-teal hover:text-teal/80"
                  data-ocid={`contacts.edit_button.${idx + 1}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-sos-red hover:text-sos-red/80"
                      data-ocid={`contacts.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="contacts.delete.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Contact</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {contact.name} from your
                        trusted contacts?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="contacts.delete.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(contact.id)}
                        className="bg-sos-red text-white hover:bg-sos-red/90"
                        data-ocid="contacts.delete.confirm_button"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="contacts.form.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Contact" : "Add Trusted Contact"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Contact name"
                required
                data-ocid="contacts.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 234 567 8900"
                type="tel"
                required
                data-ocid="contacts.phone.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                value={form.note}
                onChange={(e) =>
                  setForm((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="e.g. Mom, Best friend"
                data-ocid="contacts.note.input"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
                data-ocid="contacts.form.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal text-white hover:bg-teal/90"
                disabled={addContact.isPending || updateContact.isPending}
                data-ocid="contacts.form.submit_button"
              >
                {addContact.isPending || updateContact.isPending
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Add Contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
