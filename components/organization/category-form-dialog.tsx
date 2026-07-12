import { Pencil, Plus } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/lib/organization/actions";

type CategoryFormDialogProps = {
  mode: "create" | "edit";
  category?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
  };
};

export function CategoryFormDialog({ mode, category }: CategoryFormDialogProps) {
  const isEdit = mode === "edit";

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />
        }
      >
        {isEdit ? <Pencil /> : <Plus />}
        {isEdit ? "Edit" : "New Category"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Maintain asset grouping metadata used by the asset registry.
          </DialogDescription>
        </DialogHeader>
        <form action={isEdit ? updateCategoryAction : createCategoryAction} className="space-y-4">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`category-name-${category?.id ?? "new"}`}>
              Name
            </label>
            <Input
              id={`category-name-${category?.id ?? "new"}`}
              name="name"
              defaultValue={category?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`category-description-${category?.id ?? "new"}`}>
              Description
            </label>
            <Textarea
              id={`category-description-${category?.id ?? "new"}`}
              name="description"
              defaultValue={category?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`category-status-${category?.id ?? "new"}`}>
              Status
            </label>
            <Select
              id={`category-status-${category?.id ?? "new"}`}
              name="status"
              defaultValue={category?.status ?? "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton pendingText="Saving category">
              {isEdit ? "Save Category" : "Create Category"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
