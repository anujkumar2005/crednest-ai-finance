import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  IndianRupee,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  company: string;
  monthlyIncome: string;
  bio: string;
}

const initialProfile: UserProfile = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+91 98765 43210",
  dateOfBirth: "1990-05-15",
  gender: "Male",
  address: "123 Main Street, Sector 12",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  occupation: "Software Engineer",
  company: "Tech Solutions Pvt Ltd",
  monthlyIncome: "85000",
  bio: "Passionate about financial planning and building wealth for the future.",
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const { toast } = useToast();

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const ProfileField = ({
    icon: Icon,
    label,
    value,
    field,
    type = "text",
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    field: keyof UserProfile;
    type?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </label>
      {isEditing ? (
        <Input
          type={type}
          value={editedProfile[field]}
          onChange={(e) =>
            setEditedProfile({ ...editedProfile, [field]: e.target.value })
          }
        />
      ) : (
        <p className="text-foreground font-medium">{value}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information
            </p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {profile.name.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Personal Information
                </h3>
                <ProfileField
                  icon={User}
                  label="Full Name"
                  value={profile.name}
                  field="name"
                />
                <ProfileField
                  icon={Mail}
                  label="Email"
                  value={profile.email}
                  field="email"
                  type="email"
                />
                <ProfileField
                  icon={Phone}
                  label="Phone"
                  value={profile.phone}
                  field="phone"
                  type="tel"
                />
                <ProfileField
                  icon={Calendar}
                  label="Date of Birth"
                  value={new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  field="dateOfBirth"
                  type="date"
                />
              </div>

              {/* Address */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Address
                </h3>
                <ProfileField
                  icon={MapPin}
                  label="Street Address"
                  value={profile.address}
                  field="address"
                />
                <ProfileField
                  icon={Building}
                  label="City"
                  value={profile.city}
                  field="city"
                />
                <ProfileField
                  icon={MapPin}
                  label="State"
                  value={profile.state}
                  field="state"
                />
                <ProfileField
                  icon={MapPin}
                  label="Pincode"
                  value={profile.pincode}
                  field="pincode"
                />
              </div>

              {/* Professional */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  Professional Details
                </h3>
                <ProfileField
                  icon={Briefcase}
                  label="Occupation"
                  value={profile.occupation}
                  field="occupation"
                />
                <ProfileField
                  icon={Building}
                  label="Company"
                  value={profile.company}
                  field="company"
                />
                <ProfileField
                  icon={IndianRupee}
                  label="Monthly Income"
                  value={`₹${parseInt(profile.monthlyIncome).toLocaleString()}`}
                  field="monthlyIncome"
                  type="number"
                />
              </div>

              {/* Bio */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b border-border/50 pb-2">
                  About
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  {isEditing ? (
                    <textarea
                      className="w-full h-32 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={editedProfile.bio}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, bio: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-foreground">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
